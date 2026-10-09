import {spawnSync} from 'node:child_process';
import process from 'node:process';
for(const [command,args] of [
 ['npm',['run','typecheck:w9-4:ball']],['node',['tools/fetch-w9-4-ammo.mjs']],
 ['node',['node_modules/vite/bin/vite.js','build','--config','spikes/w9-ball/vite.config.ts']],
 ['node',['tools/check-trilogy-public.mjs']]
]){
 const r=spawnSync(command,args,{stdio:'inherit',shell:process.platform==='win32',env:{...process.env,W95_PUBLIC:'1'}});
 if(r.status!==0)process.exit(r.status??1);
}
