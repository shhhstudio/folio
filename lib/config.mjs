import {readFile,realpath,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {z} from 'zod';
export const packageRoot=fileURLToPath(new URL('../',import.meta.url));
const relative=z.string().min(1).refine(v=>!path.isAbsolute(v)&&!v.split(/[\\/]/).includes('..'),'Use a path inside this project');
const schema=z.object({
 name:z.string().min(1),url:z.url().refine(v=>/^https?:\/\//.test(v)),
 theme:z.enum(['neutral','paper90']).default('neutral'),
 contentDir:relative.default('content'),publicDir:relative.default('public'),outDir:relative.default('dist'),
 port:z.number().int().min(1024).max(65535).default(4321),
 socialImage:z.string().default(''),favicon:z.string().default('/favicon.svg')
});
export async function loadConfig(root=process.cwd()){
 root=await realpath(root);
 const value=schema.parse(JSON.parse(await readFile(path.join(root,'folio.config.json'),'utf8')));
 const config={...value,root};
 for(const key of ['contentDir','publicDir','outDir'])config[key]=path.resolve(root,value[key]);
 // Build cleanup can only delete a dedicated output directory, never source/content.
 const protectedPaths=[config.root,config.contentDir,config.publicDir,path.join(root,'node_modules'),path.join(root,'.git')];
 if(protectedPaths.some(p=>p===config.outDir||p.startsWith(config.outDir+path.sep))||config.outDir.startsWith(config.contentDir+path.sep)||config.outDir.startsWith(config.publicDir+path.sep))throw Error('outDir must be separate from content, public, dependencies and Git');
 for(const key of ['contentDir','publicDir']){await mkdir(config[key],{recursive:true});const resolved=await realpath(config[key]);if(!resolved.startsWith(root+path.sep))throw Error(key+' must stay inside the project');}
 return config;
}
