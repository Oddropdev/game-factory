import { defineConfig } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  root,
  base:'./',
  // Public packaging uses an allowlist even when paid assets exist locally.
  publicDir:process.env.W95_PUBLIC==='1'?false:undefined,
  plugins:process.env.W95_PUBLIC==='1'?[{name:'public-trilogy-content',closeBundle(){
    const out=path.resolve(root,'../../playtest-dist/ball');
    for(const name of ['ammo','levels'])fs.cpSync(path.join(root,'public',name),path.join(out,name),{recursive:true});
  }}]:[],
  define:process.env.W95_PUBLIC==='1'?{'import.meta.env.VITE_ITHAPPY_ASSETS':JSON.stringify('0')}:undefined,
  build:{
    outDir:path.resolve(root,'../../playtest-dist/ball'),
    emptyOutDir:true,
    sourcemap:false,
    target:'es2022'
  }
});
