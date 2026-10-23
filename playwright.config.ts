import { defineConfig } from '@playwright/test';
const deployedURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = deployedURL
  ? `${deployedURL.replace(/\/$/, '')}/`
  : 'http://127.0.0.1:4173/';
export default defineConfig({
  timeout: 60000,
  reporter: [['list'], ['html', { open: 'never' }]],
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    headless: true,
    reducedMotion: 'reduce',
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
  },
  webServer: deployedURL
    ? undefined
    : {
        command: 'npm run preview -- --host 127.0.0.1',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: false,
      },
});
