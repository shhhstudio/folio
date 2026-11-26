import {mkdtemp,readdir,cp,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
const pkg=JSON.parse(await readFile('package.json','utf8'));
const tarball=path.resolve(`shhh-studio-folio-${pkg.version}.tgz`);
const root=await mkdtemp(path.join(os.tmpdir(),'folio-package-'));
try{
 await cp('template',root,{recursive:true});
 const manifest=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));manifest.dependencies['@shhh-studio/folio']='file:'+tarball;
 await writeFile(path.join(root,'package.json'),JSON.stringify(manifest,null,2)+'\n');
 execFileSync('npm',['install','--omit=dev','--no-audit','--no-fund'],{cwd:root,stdio:'inherit'});
 execFileSync('npm',['run','build'],{cwd:root,stdio:'inherit'});
 const html=await readFile(path.join(root,'dist/index.html'),'utf8');
 if(!html.includes('data-design="neutral"')||html.includes('<script'))throw Error('Installed package failed the static output check');
 if((await readdir(path.join(root,'dist'))).includes('edit'))throw Error('Editor leaked into visitor output');
 execFileSync(process.execPath,[path.join(root,'node_modules/@shhh-studio/folio/bin/folio.mjs'),'init',path.join(root,'second-site')],{cwd:root,stdio:'inherit'});
 const client=new Client({name:'folio-package-smoke',version:'1.0.0'});
 try{
  await client.connect(new StdioClientTransport({command:process.execPath,args:[path.join(root,'node_modules/@shhh-studio/folio/bin/folio.mjs'),'mcp','--root',root,'--read-only'],stderr:'pipe'}));
  const {tools}=await client.listTools();if(tools.length!==5)throw Error('Installed MCP tool discovery failed');
  const page=await client.callTool({name:'folio_read_page',arguments:{slug:'home'}});if(page.isError)throw Error('Installed MCP page read failed');
 }finally{await client.close()}
 console.log('Packed package: fresh installation, neutral build, starter generation and MCP handshake passed.');
}finally{await rm(root,{recursive:true,force:true})}
