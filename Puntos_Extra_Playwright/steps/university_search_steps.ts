import { Given, When, Then } from "@cucumber/cucumber";
import { Locator, Page, expect } from "@playwright/test";
import { PlaywrightWorld } from "../support/world";

interface SearchConfig {
  buttonSelectors: string[]; // toggle de la lupa
  inputSelectors: string[]; // campo de texto de búsqueda
}

const SEARCH_CONFIG: Record<string, SearchConfig> = {
  "iteso.mx": {
    buttonSelectors: [],
    inputSelectors: [
      "#ipt-search",
      "input.text-buscador",
      "input.search-text-ipt",
    ],
  },
  "udg.mx": {
    buttonSelectors: ["#buscar_front"],
    inputSelectors: [
      "#edit-keys", // input que aparece tras abrir el buscador
      "input[name='keys']",
      "input.form-search",
    ],
  },
  "uv.mx": {
    buttonSelectors: ["#navbarDropdownSearch"],
    inputSelectors: [
      ".dropdown-search input", // input dentro del dropdown que aparece al hacer clic
      ".dropdown-menu.dropdown-search input",
    ],
  },
};

// Helpers

function domainKey(url: string): string {
  return url
    .toLowerCase()
    .replace(/https?:\/\//, "")
    .replace("www.", "")
    .split("/")[0];
}

async function acceptCookies(page: Page): Promise<void> {
  const selectors = [
    "button:has-text('Aceptar todo')",
    "button:has-text('Accept all')",
    "button:has-text('Aceptar')",
    "button:has-text('Accept')",
    "#L2AGLb",
    "form:nth-child(2) button",
  ];
  for (const sel of selectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1200 })) {
        await btn.click();
        await page.waitForTimeout(500);
        return;
      }
    } catch {}
  }
}

async function findVisibleLocator(
  page: Page,
  selectors: string[],
  timeoutMs = 2000,
): Promise<Locator | null> {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first();
      if (await loc.isVisible({ timeout: timeoutMs })) return loc;
    } catch {}
  }
  return null;
}

// Escenario 1: Búsqueda en Google

Given("I am on the Google homepage", async function (this: PlaywrightWorld) {
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
    const searchBox = await findVisibleLocator(
      this.page,
      [
        "textarea[name='q']",
        "input[name='q']",
        "[aria-label='Buscar']",
        "[aria-label='Search']",
      ],
      6000,
    );

    if (!searchBox) {
      throw new Error(
        `Search box not found on Google. URL: ${this.page.url()}`,
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
    const firstResult = this.page
      .locator("#search a[href]:not([href*='google'])")
      .first();
    await firstResult.waitFor({ timeout: 10000 });
    await firstResult.scrollIntoViewIfNeeded();
    await firstResult.click();
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForTimeout(1500);
  },
);

Then(
  "I should be on the domain {string}",
  async function (this: PlaywrightWorld, expectedDomain: string) {
    const clean = expectedDomain.toLowerCase().replace("www.", "");
    try {
      await this.page.waitForURL(`**${clean}**`, { timeout: 10000 });
    } catch {
      /* verify below */
    }
    expect(this.page.url().toLowerCase()).toContain(clean);
  },
);

// Escenarios 2 y 3: buscador interno de la universidad

Given(
  "I navigate directly to {string}",
  async function (this: PlaywrightWorld, url: string) {
    await this.page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await acceptCookies(this.page);
    await this.page.waitForTimeout(800);
  },
);

When(
  "I click the search icon and type {string}",
  async function (this: PlaywrightWorld, searchTerm: string) {
    const domain = domainKey(this.page.url());
    const config = Object.entries(SEARCH_CONFIG).find(([key]) =>
      domain.includes(key),
    )?.[1];

    if (!config) {
      throw new Error(`No hay config de búsqueda para el dominio: ${domain}`);
    }

    // Ver si el campo de busqueda ya está visible
    let input = await findVisibleLocator(
      this.page,
      config.inputSelectors,
      2000,
    );

    // Si no está visible, hacer clic en el botón/lupa para abrirlo
    if (!input) {
      if (config.buttonSelectors.length === 0) {
        throw new Error(
          `El input de búsqueda no es visible y no hay botón definido para ${domain}`,
        );
      }
      const btn = await findVisibleLocator(
        this.page,
        config.buttonSelectors,
        5000,
      );
      if (!btn) {
        throw new Error(
          `No se encontró el botón de búsqueda en ${this.page.url()}\n` +
            `Intentados: ${config.buttonSelectors.join(", ")}`,
        );
      }
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      await this.page.waitForTimeout(800);

      // Ahora buscar el input que apareció
      input = await findVisibleLocator(this.page, config.inputSelectors, 5000);
    }

    if (!input) {
      throw new Error(
        `No se encontró el campo de búsqueda en ${this.page.url()}\n` +
          `Intentados: ${config.inputSelectors.join(", ")}`,
      );
    }

    // Escribir el término y enviar
    await input.fill(searchTerm);
    await input.press("Enter");
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForTimeout(1500);
  },
);

Then(
  "I should see content related to {string}",
  async function (this: PlaywrightWorld, expectedContent: string) {
    await expect(this.page.locator("body")).toContainText(
      new RegExp(expectedContent, "i"),
      { timeout: 20000 },
    );
  },
);
