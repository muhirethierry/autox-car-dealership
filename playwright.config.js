import { defineConfig } from "@playwright/test";

const executablePath = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4180", browserName: "chromium", launchOptions: { executablePath, args: ["--no-sandbox"] }, trace: "retain-on-failure" },
  webServer: { command: "npm run dev -- --host 127.0.0.1 --port 4180 --strictPort", url: "http://127.0.0.1:4180", reuseExistingServer: !process.env.CI, timeout: 30_000 }
});
