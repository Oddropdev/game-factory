// The physics runtime is a build-time PlayCanvas-hosted asset, not a runtime CDN.
// This keeps the /ball/ mobile game offline after load and reviewable by CI.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const origin = 'https://developer.playcanvas.com/assets/modules/ammo/';
const destination = path.resolve('spikes/w9-ball/public/ammo');
fs.mkdirSync(destination, { recursive: true });
const expected = [
  {name:'ammo.wasm.js',kind:'js',min:10_000,max:2_000_000},
  {name:'ammo.wasm.wasm',kind:'wasm',min:100_000,max:5_000_000}
];
const records=[];
for(const item of expected) {
  const file=path.join(destination,item.name);
  let bytes;
  if (fs.existsSync(file)) bytes=fs.readFileSync(file);
  else {
    const response=await fetch(new URL(item.name,origin),{
      signal:AbortSignal.timeout(30_000),
      headers:{Accept:'*/*'}
    });
    if(!response.ok) throw new Error('PlayCanvas Ammo download failed: '+item.name+' HTTP '+response.status);
    bytes=Buffer.from(await response.arrayBuffer());
  }
  if(bytes.length<item.min||bytes.length>item.max) throw new Error('Suspicious physics module size '+item.name+': '+bytes.length);
  if(item.kind==='wasm' && bytes.subarray(0,4).toString('hex')!=='0061736d')
    throw new Error('Physics wasm signature mismatch');
  if(item.kind==='js' && !bytes.toString('utf8').includes('Ammo'))
    throw new Error('Physics glue is not an Ammo script');
  fs.writeFileSync(file,bytes);
  records.push({name:item.name,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
console.log(JSON.stringify({marker:'W9_4_1_SELF_HOSTED_AMMO_PASS',origin,files:records},null,2));
