#!/usr/bin/env node
import {loadConfig,packageRoot} from '../lib/config.mjs';
import {buildSite} from '../lib/build.mjs';
import {cp,mkdir,readFile,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
const args=process.argv.slice(2),command=args.shift()||'help';
function flag(name,fallback){const index=args.indexOf(name);return index===-1?fallback:args[index+1]}
try{
 if(command==='init'){
  const folder=path.resolve(args.find(a=>!a.startsWith('-'))||'my-site');
  try{await access(folder);throw Error('Destination already exists; choose a new folder.')}catch(e){if(e.code!=='ENOENT')throw e}
  await mkdir(folder,{recursive:true});await cp(path.join(packageRoot,'template'),folder,{recursive:true});
  const pkg=JSON.parse(await readFile(path.join(folder,'package.json'),'utf8'));const engine=JSON.parse(await readFile(path.join(packageRoot,'package.json'),'utf8'));
  pkg.dependencies['@shhh-studio/folio']=`https://github.com/shhhstudio/folio/releases/download/v${engine.version}/shhh-studio-folio-${engine.version}.tgz`;
  await writeFile(path.join(folder,'package.json'),JSON.stringify(pkg,null,2)+'\n');
  console.log(`Created ${folder}\nRun: cd ${folder} && npm install && npm run dev`);
 }else if(['build','dev','preview','mcp'].includes(command)){
  const config=await loadConfig(path.resolve(flag('--root',process.cwd())));
  if(flag('--port'))config.port=Number(flag('--port'));
  if(command==='build')await buildSite(config);
  if(command==='dev'){const {serve}=await import('../lib/server.mjs');await serve(config)}
  if(command==='mcp'){const {serveMcp}=await import('../lib/mcp.mjs');await serveMcp(config,{readOnly:args.includes('--read-only')})}
  if(command==='preview'){const {preview}=await import('vite');const server=await preview({configFile:false,root:config.root,build:{outDir:config.outDir},preview:{host:'127.0.0.1',port:config.port+1,strictPort:true}});server.printUrls()}
 }else if(command==='--version'||command==='version'){console.log(JSON.parse(await readFile(path.join(packageRoot,'package.json'),'utf8')).version)}
 else console.log('Folio — a website builder by Shhh Studio\n\nfolio init my-site\nfolio dev [--root path] [--port 4321]\nfolio build [--root path]\nfolio preview [--root path]\nfolio mcp --root /absolute/path/to/site [--read-only]\n\nThemes: neutral (default), paper90. Select in folio.config.json or the page inspector.');
}catch(error){console.error('Folio: '+error.message);process.exitCode=1}
