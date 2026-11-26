import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
await mkdir('dist',{recursive:true});
await build({entryPoints:['src/index.ts'],outfile:'dist/index.mjs',bundle:true,packages:'external',format:'esm',platform:'node',jsx:'automatic',target:'node22'});
await build({entryPoints:['src/editor/inline.tsx'],outfile:'dist/client/editor.js',bundle:true,format:'esm',platform:'browser',jsx:'automatic',target:'es2022',minify:true,external:['/folio-assets/*']});
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','--project','tsconfig.library.json'],{stdio:'inherit'});
