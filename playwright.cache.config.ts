import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/cache',
  workers: 1,
  timeout: 60000,
  use: {
    headless: true,
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
  },
});
