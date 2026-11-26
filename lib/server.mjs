import {createServer} from 'vite';
import sharp from 'sharp';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {packageRoot} from './config.mjs';
import {readContent,saveContent,listPages,createPage,archivePage} from './store.mjs';
import {renderPage} from './render.mjs';

async function body(req,limit){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>limit)throw Error('Request too large');chunks.push(Buffer.from(chunk))}return Buffer.concat(chunks)}
async function library(config){
 const entries=[];
 async function visit(folder,prefix){for(const entry of await readdir(folder,{withFileTypes:true})){if(entry.isSymbolicLink())continue;const file=path.join(folder,entry.name),url=prefix+'/'+entry.name;if(entry.isDirectory())await visit(file,url);else if(/\.(png|webp|jpe?g|svg|avif)$/i.test(entry.name)&&!/-640\.webp$/.test(entry.name)&&entry.name!=='favicon.svg')entries.push({label:entry.name,url})}}
 await visit(config.publicDir,'');return entries;
}
export async function serve(config){
 let queue=Promise.resolve();
 const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Folio — Editor</title><link rel="stylesheet" href="/folio-editor/editor.css"></head><body style="margin:0"><div id="root"></div><script type="module" src="/folio-editor/editor.js"></script></body></html>';
 const plugin={name:'folio-local-editor',configureServer(server){server.middlewares.use(async(req,res,next)=>{
  const url=new URL(req.url||'/','http://127.0.0.1');
  try{
   if(url.pathname.startsWith('/api/')){
    const host=req.headers.host||'';
    if(!/^(127\.0\.0\.1|localhost):\d+$/.test(host)){res.writeHead(403);res.end('Local access only');return}
    if(req.method!=='GET'&&(req.headers.origin!==`http://${host}`||req.headers['x-studio-request']!=='1')){res.writeHead(403);res.end('Invalid request origin');return}
    res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
    const slug=url.searchParams.get('page')||'home';
    const mutation=async fn=>{const result=queue.then(fn);queue=result.then(()=>{},()=>{});return result};
    if(url.pathname==='/api/pages'&&req.method==='GET'){res.end(JSON.stringify(await listPages(config)));return}
    if(url.pathname==='/api/pages'&&req.method==='POST'){const input=JSON.parse((await body(req,4096)).toString());res.end(JSON.stringify(await mutation(()=>createPage(config,input.slug,input.title))));return}
    if(url.pathname==='/api/pages'&&req.method==='DELETE'){const input=JSON.parse((await body(req,4096)).toString());res.end(JSON.stringify(await mutation(()=>archivePage(config,input.slug))));return}
    if(url.pathname==='/api/content'&&req.method==='GET'){res.end(JSON.stringify(await readContent(config,slug)));return}
    if(url.pathname==='/api/content'&&req.method==='PUT'){const input=JSON.parse((await body(req,1024*1024)).toString()),expected=String(req.headers['if-match']||'');res.end(JSON.stringify(await mutation(()=>saveContent(config,slug,input,expected))));return}
    if(url.pathname==='/api/media'&&req.method==='GET'){res.end(JSON.stringify(await library(config)));return}
    if(url.pathname==='/api/media'&&req.method==='POST'){
     const bytes=await body(req,12*1024*1024),name='upload-'+randomUUID()+'.webp',folder=path.join(config.publicDir,'media');await mkdir(folder,{recursive:true});
     const output=await sharp(bytes,{limitInputPixels:40_000_000}).rotate().resize({width:1600,withoutEnlargement:true}).webp({quality:82}).toBuffer();await writeFile(path.join(folder,name),output);res.end(JSON.stringify({url:'/media/'+name}));return;
    }
    res.writeHead(404);res.end(JSON.stringify({error:'Not found'}));return;
   }
   if(url.pathname==='/folio-assets/grain.png'){res.setHeader('Content-Type','image/png');res.end(await readFile(path.join(packageRoot,'assets/grain.png')));return}
   if(['/folio-editor/editor.js','/folio-editor/editor.css'].includes(url.pathname)){res.setHeader('Content-Type',url.pathname.endsWith('.css')?'text/css':'application/javascript');res.end(await readFile(path.join(packageRoot,'dist/client',path.basename(url.pathname))));return}
   if(url.pathname==='/edit'||url.pathname==='/edit/'){
    res.setHeader('Content-Type','text/html');res.setHeader('Cache-Control','no-store');res.end(html);return;
   }
   if(url.pathname==='/'||/^\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(url.pathname)){
    const slug=url.pathname==='/'?'home':url.pathname.split('/')[1];
    if(!(await listPages(config)).some(page=>page.slug===slug)){res.writeHead(404);res.end('Page not found');return}
    const page=await renderPage((await readContent(config,slug)).data,config,url.pathname);
    res.setHeader('Content-Type','text/html');res.setHeader('Cache-Control','no-store');res.end(page.replace('</body>','<a href="/edit/?page='+slug+'" style="position:fixed;right:20px;bottom:20px;padding:12px 20px;background:#17191c;color:white;font:14px system-ui;text-decoration:none;z-index:100">Edit this page ↗</a></body>'));return;
   }
   next();
  }catch(error){res.statusCode=error.message==='CONFLICT'?409:400;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:error.message||'Request failed'}))}
 })}};
 const server=await createServer({configFile:false,root:config.root,publicDir:config.publicDir,plugins:[plugin],server:{host:'127.0.0.1',port:config.port,strictPort:true},optimizeDeps:{noDiscovery:true,include:[]},appType:'mpa'});
 await server.listen();server.printUrls();return server;
}
