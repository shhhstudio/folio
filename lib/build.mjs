import {readFile,writeFile,mkdir,rm,cp,readdir,lstat} from 'node:fs/promises';
import path from 'node:path';
import {listPages,readContent} from './store.mjs';
import {renderPage} from './render.mjs';
import {packageRoot} from './config.mjs';
export async function validateAssets(folder){
 for(const entry of await readdir(folder,{withFileTypes:true})){
  const file=path.join(folder,entry.name);if((await lstat(file)).isSymbolicLink())throw Error('Public assets cannot be symlinks: '+file);
  if(entry.isDirectory())await validateAssets(file);
  else if(/\.(webp|png|jpe?g|gif|avif|svg|mp4|mov)$/i.test(file)){
   const bytes=await readFile(file);if(bytes.subarray(0,100).toString().startsWith('version https://git-lfs.github.com/spec/v1'))throw Error('Unresolved Git LFS pointer: '+file+'. Run git lfs pull before building.');
  }
 }
}
export async function buildSite(config){
 await validateAssets(config.publicDir);
 const pages=await listPages(config);
 // Validate/render before touching the previous build.
 const rendered=await Promise.all(pages.map(async p=>({...p,html:await renderPage((await readContent(config,p.slug)).data,config,p.path)})));
 const outputInfo=await lstat(config.outDir).catch(e=>{if(e.code!=='ENOENT')throw e;return null});
 if(outputInfo?.isSymbolicLink())throw Error('Output must not be a symlink');
 await rm(config.outDir,{recursive:true,force:true});await mkdir(config.outDir,{recursive:true});
 await cp(config.publicDir,config.outDir,{recursive:true});
 await mkdir(path.join(config.outDir,'folio-assets'),{recursive:true});await cp(path.join(packageRoot,'assets/grain.png'),path.join(config.outDir,'folio-assets/grain.png'));
 for(const page of rendered){const folder=page.slug==='home'?config.outDir:path.join(config.outDir,page.slug);await mkdir(folder,{recursive:true});await writeFile(path.join(folder,'index.html'),page.html)}
 await writeFile(path.join(config.outDir,'404.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Page not found</title></head><body><h1>Page not found.</h1><a href="/">Back to the homepage</a></body></html>');
 console.log(`${config.name}: ${pages.length} page(s) built in ${config.outDir}. Static HTML/CSS; no editor or client JavaScript.`);
 return config.outDir;
}
