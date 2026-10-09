// Self-contained offline Windows preview: no npm packages or private GLBs.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath,URL} from 'node:url';
import process from 'node:process';
import {networkInterfaces} from 'node:os';
import {spawn} from 'node:child_process';
const root=resolve(fileURLToPath(new URL('../playtest-dist/ball/',import.meta.url)));
const port=4177;
const lanMode=process.argv.includes('--lan');
const bindHost=lanMode?'0.0.0.0':'127.0.0.1';
const defaultMode=process.argv.includes('--trilogy')?'trilogy':process.argv.includes('--twolevel')?'twolevel':'transit';
const mime={'.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.wasm':'application/wasm','.json':'application/json',
  '.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'};
createServer(async(req,res)=>{
  try {
    if(req.method!=='GET'&&req.method!=='HEAD'){
      res.writeHead(405).end('Method not allowed');return;
    }
    const pathname=new URL(req.url??'/',`http://127.0.0.1:${port}`).pathname;
    if(!(/^\/ball(?:\/|$)/).test(pathname)){
      res.writeHead(302,{Location:'/ball/?mode='+defaultMode}).end();return;
    }
    const segment=decodeURIComponent(pathname.replace(/^\/ball\/?/,''));
    const local=resolve(root,segment||'index.html');
    if(local!==root&&!local.startsWith(root+sep)){
      res.writeHead(403).end('Forbidden');return;
    }
    const bytes=await readFile(local);
    res.writeHead(200,{'Content-Type':mime[extname(local)]??'application/octet-stream',
      'Cache-Control':'no-cache'});
    if(req.method==='HEAD')res.end();else res.end(bytes);
  }catch{
    res.writeHead(404).end('Not found');
  }
}).listen(port,bindHost,()=>{
  const url=`http://127.0.0.1:${port}/ball/?mode=${defaultMode}`;
  process.stdout.write(`Ball Runner desktop preview: ${url}\n`);
  if(lanMode){
    const seen=new Set();
    for(const [label,connections] of Object.entries(networkInterfaces())){
      for(const c of connections??[]){
        if(c.family!=='IPv4'||c.internal||c.address.startsWith('169.254')||
          seen.has(c.address))continue;
        seen.add(c.address);
        process.stdout.write(`Android (same Wi-Fi, ${label}): http://${c.address}:${port}/ball/?mode=trilogy\n`);
      }
    }
    if(!seen.size)process.stdout.write('No local Wi-Fi/LAN IPv4 found. Connect the PC to a network.\n');
    process.stdout.write('Android: open the URL in Chrome. Allow Node.js on PRIVATE Windows networks if prompted.\n');
    process.stdout.write('LAN-only; no public deployment. Everyone on this local network can open the preview while running.\n');
  }
  process.stdout.write('Press Ctrl+C to stop.\n');
  if(process.platform==='win32'){
    const child=spawn('cmd.exe',['/c','start','',url],
      {stdio:'ignore',detached:true});
    child.unref();
  }
});
