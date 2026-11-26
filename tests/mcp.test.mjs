import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,readdir,rm,symlink} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {packageRoot} from '../lib/config.mjs';

async function session(fn,{readOnly=false}={}){
 const root=await mkdtemp(path.join(os.tmpdir(),'folio-mcp-'));let client;
 try{
  await cp(path.join(packageRoot,'template'),root,{recursive:true});
  client=new Client({name:'folio-integration-tests',version:'1.0.0'});
  const transport=new StdioClientTransport({command:process.execPath,args:[path.join(packageRoot,'bin/folio.mjs'),'mcp','--root',root,...(readOnly?['--read-only']:[])],stderr:'pipe'});
  let stderr='';transport.stderr?.on('data',chunk=>{stderr+=chunk.toString()});
  await client.connect(transport);
  const call=async(name,args={})=>{const response=await client.callTool({name,arguments:args});assert.ok(!response.isError,JSON.stringify(response));return response.structuredContent||JSON.parse(response.content[0].text)};
  await fn({root,client,call,stderr:()=>stderr});
 }finally{await client?.close();await rm(root,{recursive:true,force:true})}
}
test('packaged CLI speaks MCP over stdio and exposes schema, guide and site media',async()=>session(async({client,call})=>{
 const {tools}=await client.listTools();assert.equal(tools.length,14);assert.ok(tools.find(t=>t.name==='folio_save_page').inputSchema.properties.revision);
 assert.ok(tools.find(t=>t.name==='folio_read_page').annotations.readOnlyHint);
 const site=await call('folio_get_site');assert.equal(site.defaultTheme,'neutral');assert.equal(site.readOnly,false);
 const schema=await call('folio_get_schema');assert.equal(schema.schema.type,'object');
 const pages=await call('folio_list_pages');assert.equal(pages.pages.length,1);
 const media=await call('folio_list_media');assert.ok(media.media.some(m=>m.url==='/media/example.svg'));
 const {resources}=await client.listResources();assert.ok(resources.some(r=>r.uri==='folio://guide'));
 const guide=await client.readResource({uri:'folio://guide'});assert.deepEqual(JSON.parse(guide.contents[0].text).themes,['neutral','paper90']);
}));
test('MCP edits sections, Markdown and themes with history and conflict protection',async()=>session(async({root,client,call,stderr})=>{
 const initial=await call('folio_read_page');
 let next=await call('folio_add_section',{revision:initial.revision,type:'Article',index:1,props:{title:'A story',body:'# A heading\n\nFirst **paragraph**.'}});
 const article=next.data.content[1];assert.equal(article.type,'Article');
 const stale=await client.callTool({name:'folio_set_theme',arguments:{revision:initial.revision,designTheme:'paper90'}});assert.equal(stale.isError,true);assert.match(stale.content[0].text,/CONFLICT/);
 next=await call('folio_update_section',{revision:next.revision,sectionId:article.props.id,props:{body:'A revised **story**.',media:'discs'}});
 next=await call('folio_move_section',{revision:next.revision,sectionId:article.props.id,index:2});assert.equal(next.data.content[2].props.id,article.props.id);
 next=await call('folio_set_theme',{revision:next.revision,designTheme:'paper90',appearance:'dark'});
 assert.equal(next.data.root.props.designTheme,'paper90');assert.equal(next.data.root.props.theme,'dark');
 assert.equal(next.data.content[2].props.body,'A revised **story**.');
 const built=await call('folio_build');assert.equal(built.published,false);
 const html=await readFile(path.join(root,'dist/index.html'),'utf8');assert.match(html,/data-design="paper90"/);assert.match(html,/<strong>story<\/strong>/);assert.doesNotMatch(html,/<script/);
 assert.match(stderr(),/Static HTML\/CSS/);assert.equal((await call('folio_list_pages')).pages.length,1); // build logs did not corrupt stdout
 const modified=structuredClone(next.data);modified.root.props.description='Metadata edited by MCP';
 next=await call('folio_save_page',{revision:next.revision,data:modified});assert.equal(next.data.root.props.description,modified.root.props.description);
 next=await call('folio_remove_section',{revision:next.revision,sectionId:article.props.id});assert.ok(!next.data.content.some(s=>s.props.id===article.props.id));
 const hero=next.data.content.find(s=>s.type==='Hero');
 const protectedHero=await client.callTool({name:'folio_remove_section',arguments:{revision:next.revision,sectionId:hero.props.id}});assert.equal(protectedHero.isError,true);
 assert.equal((await readdir(path.join(root,'content/.history'))).length,6);
}));
test('MCP creates and archives draft pages, rejects unsafe writes and path escapes',async()=>session(async({root,client,call})=>{
 const created=await call('folio_create_page',{slug:'a-story',title:'A story'});assert.equal(created.data.root.props.draft,true);
 const read=await call('folio_read_page',{slug:'a-story'});
 const data=structuredClone(read.data);data.root.props.navigation[0].href='javascript:alert(1)';
 const unsafe=await client.callTool({name:'folio_save_page',arguments:{slug:'a-story',revision:read.revision,data}});assert.equal(unsafe.isError,true);
 const typo=await client.callTool({name:'folio_update_section',arguments:{slug:'a-story',revision:read.revision,sectionId:read.data.content[0].props.id,props:{titel:'Typo'}}});assert.equal(typo.isError,true);
 await call('folio_archive_page',{slug:'a-story',revision:read.revision});assert.equal((await call('folio_list_pages')).pages.length,1);assert.equal((await readdir(path.join(root,'content/.archive'))).length,1);
 const home=await call('folio_read_page');const protectedHome=await client.callTool({name:'folio_archive_page',arguments:{slug:'home',revision:home.revision}});assert.equal(protectedHome.isError,true);
 const traversal=await client.callTool({name:'folio_read_page',arguments:{slug:'../home'}});assert.equal(traversal.isError,true);
 await symlink(path.join(packageRoot,'template/content/home.json'),path.join(root,'content/pages/escape.json'));
 const escaped=await client.callTool({name:'folio_read_page',arguments:{slug:'escape'}});assert.equal(escaped.isError,true);assert.match(escaped.content[0].text,/Symlink escapes/);
 const escapedList=await client.callTool({name:'folio_list_pages',arguments:{}});assert.equal(escapedList.isError,true);
 const escapedBuild=await client.callTool({name:'folio_build',arguments:{}});assert.equal(escapedBuild.isError,true);
}));
test('read-only MCP sessions expose no tools that mutate files',async()=>session(async({client,call,root})=>{
 const before=await readFile(path.join(root,'content/home.json'),'utf8');
 const {tools}=await client.listTools();assert.equal(tools.length,5);assert.ok(tools.every(t=>t.annotations.readOnlyHint));
 assert.equal((await call('folio_get_site')).readOnly,true);
 await assert.rejects(client.callTool({name:'folio_build',arguments:{}}));
 assert.equal(await readFile(path.join(root,'content/home.json'),'utf8'),before);
},{readOnly:true}));
