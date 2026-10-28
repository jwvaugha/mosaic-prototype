import { defineConfig } from "@playwright/test"

// Browser checks for layout and responsiveness. Uses the Chrome installed on
// this machine (no Playwright browser download) against the production build.
//   npm run e2e
export default defineConfig({
  testDir: "e2e",
  outputDir: "e2e/.results",
  fullyParallel: true,
  retries: 1,
  reporter: [["list"]],
  use: {
    channel: "chrome",
    baseURL: "http://localhost:4318/mosaic-prototype/",
  },
  webServer: {
    command: "npx vite preview --port 4318 --strictPort",
    url: "http://localhost:4318/mosaic-prototype/",
    reuseExistingServer: true,
  },
})
