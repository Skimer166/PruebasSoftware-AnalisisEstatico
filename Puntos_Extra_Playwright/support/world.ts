import {
  setWorldConstructor,
  World,
  Before,
  After,
  IWorldOptions,
  setDefaultTimeout,
} from "@cucumber/cucumber";

// Aumentar timeout global a 60 segundos
setDefaultTimeout(60 * 1000);
import { Browser, BrowserContext, Page, chromium } from "playwright";

// Extend the Cucumber World with Playwright objects

export class PlaywrightWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(PlaywrightWorld);

// Hooks

Before(async function (this: PlaywrightWorld) {
  const headed = process.env.HEADED === "true";

  this.browser = await chromium.launch({
    headless: !headed,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  this.context = await this.browser.newContext({
    // Realistic viewport and user-agent to avoid bot detection
    viewport: { width: 1280, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/124.0.0.0 Safari/537.36",
  });

  this.page = await this.context.newPage();
});

After(async function (this: PlaywrightWorld) {
  await this.context?.close();
  await this.browser?.close();
});
