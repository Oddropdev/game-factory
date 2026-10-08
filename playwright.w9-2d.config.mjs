import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/playcanvas',
  timeout:40_000,retries:0,workers:1,reporter:[['list']],
  use:{baseURL:'http://127.0.0.1:4177',headless:true,viewport:{width:390,height:844},hasTouch:true,isMobile:true},
  webServer:{
    command:'npm run preview -- --outDir playtest-dist --host 127.0.0.1 --port 4177',
    port:4177,reuseExistingServer:false,timeout:30_000
  }
});
