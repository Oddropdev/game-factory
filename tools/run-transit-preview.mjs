// Self-contained offline Windows preview: no npm packages or private GLBs.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=resolve(fileURLToPath(new URL('../playtest-dist/ball/',import.meta.url)));
const port=4177;
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
      res.writeHead(302,{Location:'/ball/?mode=transit'}).end();return;
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
}).listen(port,'127.0.0.1',()=>{
  const url=`http://127.0.0.1:${port}/ball/?mode=transit`;
  process.stdout.write(`W9.4-7 Magnetic Tube preview: ${url}\nPress Ctrl+C to stop.\n`);
  if(process.platform==='win32'){
    const child=spawn('cmd.exe',['/c','start','',url],
      {stdio:'ignore',detached:true});
    child.unref();
  }
});
