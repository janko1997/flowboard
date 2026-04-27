import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,    // sync tests share server state — run serially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    // Slow down mouse events so dnd-kit's PointerSensor reliably detects the drag
    launchOptions: { slowMo: 50 },
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Reuse an already-running dev server locally; always start one in CI.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
