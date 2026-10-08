import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/spike',
  timeout: 25000, retries: 0, workers: 1, reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4176',
    headless: true, hasTouch: true, isMobile: true,
    viewport: { width: 390, height: 844 }
  },
  webServer: {
    command: 'npm run preview -- --outDir playtest-dist --host 127.0.0.1 --port 4176',
    port: 4176, reuseExistingServer: false, timeout: 30000
  }
});
