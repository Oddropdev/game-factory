import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/ball',testMatch:'w9-6-*.spec.mjs',
 timeout:600_000,retries:0,workers:1,
 reporter:[['list'],['json',{outputFile:'test-results/w9-6-results.json'}]],
 use:{baseURL:'http://127.0.0.1:4179',viewport:{width:390,height:844},isMobile:true,hasTouch:true},
 webServer:{command:'npm run preview -- --outDir playtest-dist --host 127.0.0.1 --port 4179',
  port:4179,reuseExistingServer:false,timeout:30000}
});
