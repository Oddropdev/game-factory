import {defineConfig} from '@playwright/test';
import process from 'node:process';
export default defineConfig({
 testDir:'./tests/ball',testMatch:'w9-5-*.spec.mjs',timeout:120_000,retries:0,workers:1,
 reporter:[['list'],['json',{outputFile:'test-results/trilogy-results.json'}]],
 use:{baseURL:'http://127.0.0.1:4179',viewport:{width:390,height:844},isMobile:true,hasTouch:true,
  launchOptions:process.env.W95_CHROMIUM?{executablePath:process.env.W95_CHROMIUM,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{}},
 webServer:{command:process.env.W95_OWNER==='1'?'npm run preview -- --outDir ../owner-preview --host 127.0.0.1 --port 4179':'npm run preview -- --outDir playtest-dist --host 127.0.0.1 --port 4179',port:4179,reuseExistingServer:false,timeout:30_000}
});
