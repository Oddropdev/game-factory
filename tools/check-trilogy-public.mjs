import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
const root='playtest-dist/ball';let count=0;
function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){
 const path=join(dir,e.name);if(/licensed|private|\.glb$|\.zip$/i.test(e.name))throw Error('Private source in public build: '+path);
 if(e.isDirectory())walk(path);else count++;
}}
walk(root);
for(const world of ['crystal','candy','rainbow']){
 const m=JSON.parse(readFileSync(join(root,'levels',world+'.json'),'utf8'));
 if(m.id!==world||!JSON.parse(readFileSync(join(root,'levels',world+'-road.json'),'utf8')).length)throw Error('Missing content '+world);
}
console.log('W95_UNLICENSED_PREVIEW_PASS '+count+' files; three independent worlds; no GLB/ZIP/private paths');
