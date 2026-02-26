import { defineConfig, devices } from '@playwright/test';

const PROD_URL = 'https://mon-budget-seven.vercel.app';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: 'html',
  expect: {
    timeout: 15000, // Match actionTimeout — Neon DB can cold-start in 5-10s on production
  },
  use: {
    baseURL: PROD_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
