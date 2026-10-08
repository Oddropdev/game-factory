import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir:'./tests/ball',
  timeout:35_000,
  retries:0,
  workers:1,
  reporter:[['list']],
  use:{
    baseURL:'http://127.0.0.1:4177',
    viewport:{width:390,height:844},
    headless:true,
    isMobile:true,
    hasTouch:true
  },
  webServer:{
    command:'npm run preview -- --outDir playtest-dist --host 127.0.0.1 --port 4177',
    port:4177,
    reuseExistingServer:false,
    timeout:30_000
  }
});
