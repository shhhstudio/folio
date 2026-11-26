import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,writeFile,readdir,rm,mkdir,symlink} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {components,pageSchema,articleDefaults} from '../dist/index.mjs';
import {loadConfig,packageRoot} from '../lib/config.mjs';
import {renderPage} from '../lib/render.mjs';
import {readContent,saveContent,createPage,archivePage,listPages,pageFile} from '../lib/store.mjs';
import {buildSite} from '../lib/build.mjs';
async function fixture(fn){const root=await mkdtemp(path.join(os.tmpdir(),'folio-'));try{await cp(path.join(packageRoot,'template'),root,{recursive:true});await fn(await loadConfig(root))}finally{await rm(root,{recursive:true,force:true})}}
test('blank pages inherit the site theme and expose no personal content',async()=>fixture(async config=>{
 const input=JSON.parse(await readFile(pageFile(config),'utf8'));
 assert.equal((await readContent(config)).data.root.props.designTheme,'neutral');
 const paper90={...config,theme:'paper90'};assert.equal((await readContent(paper90)).data.root.props.designTheme,'paper90');
 input.root.props.designTheme='neutral';assert.equal((await renderPage(input,paper90)).includes('data-design="neutral"'),true);
 const html=await renderPage(input,config);
 assert.doesNotMatch(html,/Romain|Plato|Paperclap|Lisbon|<script|contenteditable/);
 assert.match(html,/canonical" href="https:\/\/example.com\/"/);assert.equal((html.match(/<h1>/g)||[]).length,1);
}));
test('all section types share illustration controls and legacy defaults',async()=>fixture(async config=>{
 const data=(await readContent(config)).data;
 const blocks=[...data.content,{type:'Article',props:{...articleDefaults,id:'article'}},{type:'Photo',props:{id:'photo',caption:'Photo'}},{type:'Cards',props:{id:'cards',label:'Cards',title:'Cards',items:[]}}];
 for(const type of ['Hero','Section','Photo','Cards','Links','Article']){
  const b=pageSchema.parse({...data,content:[...data.content.filter(b=>b.type!==type),blocks.find(b=>b.type===type)]}).content.find(b=>b.type===type);
  for(const media of ['none','discs','scribble','image']){
   const html=renderToStaticMarkup(createElement(components[type],{...b.props,media,image:'/media/example.svg',alt:'Example'}));
   if(media==='none')assert.doesNotMatch(html,/ds-illustration/);else assert.ok(html.includes('illustration-'+media),type+' '+media);
  }
 }
}));
test('saves preserve history, reject stale writers, and stay in the selected site',async()=>fixture(async config=>{
 const before=await readContent(config),next=structuredClone(before.data);next.root.props.title='Changed';
 await saveContent(config,'home',next,before.revision);assert.equal((await readContent(config)).data.root.props.title,'Changed');
 await assert.rejects(saveContent(config,'home',before.data,before.revision),/CONFLICT/);
 const history=await readdir(path.join(config.contentDir,'.history'));assert.equal(history.length,1);
 assert.equal(JSON.parse(await readFile(path.join(config.contentDir,'.history',history[0]),'utf8')).root.props.title,before.data.root.props.title);
}));
test('page creation and recoverable deletion preserve the homepage',async()=>fixture(async config=>{
 const page=await createPage(config,'À propos','About');assert.equal(page.slug,'a-propos');assert.equal(page.data.root.props.draft,true);
 assert.equal((await listPages(config)).length,2);await assert.rejects(createPage(config,'a-propos','Duplicate'),/already used/);
 await archivePage(config,'a-propos');assert.equal((await listPages(config)).length,1);
 assert.equal((await readdir(path.join(config.contentDir,'.archive'))).length,1);await assert.rejects(archivePage(config,'home'),/cannot/);
 for(const slug of ['../escape','edit','api','media'])assert.throws(()=>pageFile(config,slug));
}));
test('static builds exclude the editor and fail on unresolved LFS files',async()=>fixture(async config=>{
 await buildSite(config);assert.match(await readFile(path.join(config.outDir,'index.html'),'utf8'),/A place for/);
 assert.equal((await readdir(config.outDir)).includes('edit'),false);
 const before=await readFile(path.join(config.outDir,'index.html'),'utf8');
 await writeFile(path.join(config.publicDir,'media/missing.webp'),'version https://git-lfs.github.com/spec/v1\noid sha256:fake\nsize 99\n');
 await assert.rejects(buildSite(config),/Unresolved Git LFS/);
 assert.equal(await readFile(path.join(config.outDir,'index.html'),'utf8'),before);
}));
test('configuration rejects output paths that would overwrite content',async()=>fixture(async config=>{
 const filename=path.join(config.root,'folio.config.json'),value=JSON.parse(await readFile(filename,'utf8'));
 for(const outDir of ['.','content','public','../elsewhere']){await writeFile(filename,JSON.stringify({...value,outDir}));await assert.rejects(loadConfig(config.root))}
 await writeFile(filename,JSON.stringify(value));await symlink(config.contentDir,config.outDir);await assert.rejects(buildSite(config),/symlink/);
}));
test('schema and Markdown reject executable URLs and escape raw HTML',async()=>fixture(async config=>{
 const data=(await readContent(config)).data;data.content[1].props.body='**Bold** <script>alert(1)</script> [bad](javascript:alert(1))';
 const html=await renderPage(data,config);assert.match(html,/<strong>Bold<\/strong>/);assert.doesNotMatch(html,/<script|href="javascript:/);
 data.content[0].props.image='javascript:alert(1)';assert.equal(pageSchema.safeParse(data).success,false);
}));
test('local editor serves from an installed package and rejects cross-origin writes',async()=>fixture(async config=>{
 const {serve}=await import('../lib/server.mjs');config.port=44000+Math.floor(Math.random()*2000);const server=await serve(config);
 try{
  const origin='http://127.0.0.1:'+config.port;
  const r=await fetch(origin+'/edit/');assert.equal(r.status,200);const html=await r.text();assert.match(html,/src="\/folio-editor\/editor.js/);
  const js=await fetch(origin+'/folio-editor/editor.js');assert.equal(js.status,200);assert.doesNotMatch(await js.text(),/Internal Server Error/);
  const invalid=await fetch(origin+'/api/pages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug:'test',title:'Test'})});assert.equal(invalid.status,403);
  const valid=await fetch(origin+'/api/pages',{method:'POST',headers:{'Content-Type':'application/json','X-Studio-Request':'1',Origin:origin},body:JSON.stringify({slug:'test',title:'Test'})});assert.equal(valid.status,200);
  assert.equal((await listPages(config)).length,2);
 }finally{await server.close()}
}));
