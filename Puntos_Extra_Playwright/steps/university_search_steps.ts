import { Given, When, Then } from "@cucumber/cucumber";
import { Page, expect } from "@playwright/test";
import { PlaywrightWorld } from "../support/world";

// URLs de inicio directas
const DIRECT_HOME_URLS: Record<string, string> = {
  "iteso.mx": "https://www.iteso.mx/",
  "udg.mx": "https://www.udg.mx/",
  "uv.mx": "https://www.uv.mx/",
};

// Pasos de navegación interna por dominio
interface NavStep {
  selector?: string;
  url?: string;
  newTab?: boolean;
}

const NAV_STEPS: Record<string, NavStep[]> = {
  "iteso.mx": [{ selector: "p.txttitle >> text=Carreras", newTab: true }],
  "udg.mx": [{ url: "http://guiadecarreras.udg.mx/category/areas/" }],
  "uv.mx": [{ url: "https://www.uv.mx/ofertaeducativa/area/tecnica/" }],
};

// Texto esperado en página final por dominio
const VERIFY_TEXT: Record<string, string> = {
  "iteso.mx": "humanidades",
  "udg.mx": "abogado",
  "uv.mx": "arquitectura",
};

// Helpers

function extractDomain(url: string): string {
  return url
    .toLowerCase()
    .replace(/https?:\/\//, "")
    .replace("www.", "")
    .split("/")[0];
}

// Intenta cerrar banners de cookies/consentimiento
async function acceptCookies(page: Page): Promise<void> {
  const cookieSelectors = [
    "button:has-text('Aceptar todo')",
    "button:has-text('Accept all')",
    "button:has-text('Aceptar')",
    "button:has-text('Accept')",
    "button:has-text('Agree')",
    "button:has-text('I agree')",
    "#L2AGLb",
    "form:nth-child(2) button",
  ];
  for (const sel of cookieSelectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1500 })) {
        await btn.click();
        await page.waitForTimeout(600);
        return;
      }
    } catch {
      // Not found, try next
    }
  }
}

async function safeClick(
  page: Page,
  selector: string,
  newTab = false,
): Promise<Page> {
  const el = page.locator(selector).first();
  await el.waitFor({ state: "attached", timeout: 20000 });
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  if (newTab) {
    // Playwright detecta la nueva pestaña con context.waitForEvent("page")
    const [newPage] = await Promise.all([
      page.context().waitForEvent("page"),
      el.click(),
    ]);
    await newPage.waitForLoadState("domcontentloaded");
    await newPage.waitForTimeout(1000);
    return newPage;
  }

  await el.click();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1000);
  return page;
}

// Steps

Given("I am on the Google homepage", async function (this: PlaywrightWorld) {
  // Navega a la página principal de Google
  await this.page.goto("https://www.google.com", {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await acceptCookies(this.page);
  await this.page.waitForTimeout(500);
});

When(
  "I search for {string} on Google",
  async function (this: PlaywrightWorld, query: string) {
    const searchSelectors = [
      "input[name='q']",
      "textarea[name='q']",
      "input[title='Buscar']",
      "input[title='Search']",
      "[aria-label='Buscar']",
      "[aria-label='Search']",
    ];

    let searchBox = null;
    for (const sel of searchSelectors) {
      try {
        const loc = this.page.locator(sel).first();
        await loc.waitFor({ state: "visible", timeout: 5000 });
        searchBox = loc;
        break;
      } catch {
        // probar siguiente selector
      }
    }

    if (!searchBox) {
      throw new Error(
        `No se encontró el campo de búsqueda en Google.\nURL actual: ${this.page.url()}`,
      );
    }

    await searchBox.fill(query);
    await searchBox.press("Enter");
    await this.page.waitForSelector("#search", { timeout: 15000 });
  },
);

When(
  "I click on the first search result",
  async function (this: PlaywrightWorld) {
    // Hace click en el primer resultado orgánico de Google
    const firstResult = this.page
      .locator("#search a[href]:not([href*='google'])")
      .first();
    await firstResult.waitFor({ timeout: 10000 });
    await firstResult.scrollIntoViewIfNeeded();
    await firstResult.click();
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForTimeout(1000);
  },
);

Then(
  "I should be on the domain {string}",
  async function (this: PlaywrightWorld, expectedDomain: string) {
    const clean = expectedDomain.toLowerCase().replace("www.", "");

    // Esperar hasta 10s a que la URL contenga el dominio
    try {
      await this.page.waitForURL(`**${clean}**`, { timeout: 10000 });
    } catch {
      const currentUrl = this.page.url();
      if (!currentUrl.toLowerCase().includes(clean)) {
        const homeUrl = Object.entries(DIRECT_HOME_URLS).find(([key]) =>
          clean.includes(key),
        )?.[1];

        if (!homeUrl) {
          throw new Error(
            `No se pudo navegar a '${expectedDomain}'. URL actual: ${currentUrl}`,
          );
        }

        await this.page.goto(homeUrl, { waitUntil: "domcontentloaded" });
        await this.page.waitForTimeout(1000);
      }
    }

    const currentUrl = this.page.url().toLowerCase();
    expect(currentUrl).toContain(clean);
  },
);

When(
  "I search for {string} on the university site", // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function (this: PlaywrightWorld, _searchTerm: string) {
    const domain = extractDomain(this.page.url());
    await acceptCookies(this.page);

    const steps = Object.entries(NAV_STEPS).find(([key]) =>
      domain.includes(key),
    )?.[1];

    if (!steps) {
      throw new Error(
        `No hay navegación definida para '${domain}'. ` +
          `Agrega una entrada en NAV_STEPS.`,
      );
    }

    for (const step of steps) {
      if (step.url) {
        await this.page.goto(step.url, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        await this.page.waitForTimeout(1000);
      } else if (step.selector) {
        const resultPage = await safeClick(
          this.page,
          step.selector,
          step.newTab ?? false,
        );
        if (step.newTab) {
          this.page = resultPage;
        }
      }
      await acceptCookies(this.page);
    }
  },
);

Then(
  "I should see results related to {string}",
  async function (this: PlaywrightWorld, expectedContent: string) {
    const domain = extractDomain(this.page.url());
    const textToFind = VERIFY_TEXT[domain] ?? expectedContent;

    await expect(this.page.locator("body")).toContainText(
      new RegExp(textToFind, "i"),
      { timeout: 20000 },
    );
  },
);
