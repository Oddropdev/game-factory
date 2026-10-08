import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/release',
  timeout: 20_000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4175',
    headless: true,
    hasTouch: true,
    isMobile: true
  },
  webServer: {
    command: 'npm run preview -- --outDir playtest-dist --host 127.0.0.1 --port 4175',
    port: 4175,
    reuseExistingServer: false,
    timeout: 30_000
  }
});
