import {readFile,writeFile,readdir,mkdir,rename} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
import {pageSchema,heroDefaults,sectionDefaults} from '../dist/index.mjs';
export const revision=raw=>createHash('sha256').update(raw).digest('hex');
export function pageFile(config,slug='home'){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||['api','edit','studio','media','photos','assets','folio-assets'].includes(slug))throw Error('Choose a page address such as about-me.');
 return path.join(config.contentDir,slug==='home'?'home.json':`pages/${slug}.json`);
}
export function parsePage(config,input){return pageSchema.parse({...input,root:{props:{...input.root?.props,designTheme:input.root?.props?.designTheme||config.theme}}})}
export async function readContent(config,slug='home'){
 const raw=await readFile(pageFile(config,slug),'utf8');return {data:parsePage(config,JSON.parse(raw)),revision:revision(raw)};
}
export async function saveContent(config,slug,input,expected){
 const file=pageFile(config,slug),data=parsePage(config,input),previous=await readFile(file,'utf8');
 if(revision(previous)!==expected)throw Error('CONFLICT');
 const history=path.join(config.contentDir,'.history');await mkdir(history,{recursive:true});
 await writeFile(path.join(history,`${slug}-${Date.now()}-${randomUUID()}.json`),previous);
 const raw=JSON.stringify(data,null,2)+'\n',temp=file+'.'+randomUUID()+'.tmp';
 await writeFile(temp,raw);await rename(temp,file);return {data,revision:revision(raw)};
}
export async function listPages(config){
 const folder=path.join(config.contentDir,'pages');await mkdir(folder,{recursive:true});
 const slugs=['home',...(await readdir(folder)).filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5))];
 return Promise.all(slugs.map(async slug=>({slug,title:(await readContent(config,slug)).data.root.props.title,path:slug==='home'?'/':`/${slug}/`})));
}
export async function createPage(config,address,title){
 const slug=String(address||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 title=String(title||'').trim();if(!title||!slug||slug==='home')throw Error('Add a title and a unique address.');
 const file=pageFile(config,slug);await mkdir(path.dirname(file),{recursive:true});
 const home=(await readContent(config)).data;
 const data=parsePage(config,{root:{props:{...home.root.props,title,description:'',draft:true}},content:[{type:'Hero',props:{...heroDefaults,id:randomUUID(),title}},{type:'Section',props:{...sectionDefaults,id:randomUUID()}}]});
 try{await writeFile(file,JSON.stringify(data,null,2)+'\n',{flag:'wx'})}catch(e){if(e.code==='EEXIST')throw Error('This address is already used.');throw e}
 return {slug,data};
}
export async function archivePage(config,slug){
 if(slug==='home')throw Error('The homepage cannot be deleted.');
 const archive=path.join(config.contentDir,'.archive');await mkdir(archive,{recursive:true});
 await rename(pageFile(config,slug),path.join(archive,`${slug}-${Date.now()}-${randomUUID()}.json`));return {slug};
}
