import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts/,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Sequential execution prevents race conditions when managing stock items
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://storemate-final.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'on',
    video:
      process.env.VIDEO === 'true' || process.env.VIDEO === '1'
        ? 'on'
        : (process.env.VIDEO as any) || 'retain-on-failure',
    launchOptions: {
      slowMo: process.env.SLOWMO
        ? parseInt(process.env.SLOWMO, 10)
        : (process.env.VIDEO === 'on' || process.env.VIDEO === 'true' || process.env.VIDEO === '1' ? 1000 : 0),
    },
    headless: process.env.HEADLESS !== 'false',
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
