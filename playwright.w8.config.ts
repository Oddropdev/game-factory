import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/feel',
  timeout: 30_000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4174',
    headless: true,
    hasTouch: true,
    isMobile: true,
    video: {
      mode: 'on',
      size: {
        width: 390,
        height: 844
      }
    }
  },
  webServer: {
    command:
      'npm run preview -- --host 127.0.0.1 --port 4174',
    port: 4174,
    reuseExistingServer: false,
    timeout: 30_000
  }
});
