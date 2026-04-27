# University Search – BDD + DDT + Playwright (TypeScript)

Prueba automatizada de búsqueda universitaria usando **Cucumber.js** (BDD),
**Scenario Outline / Examples** (DDT) y **Playwright** (automatización de browser).

> Equivalente al ejercicio de Selenium/Python, pero en TypeScript con Playwright.

---

## Stack tecnológico

| Herramienta        | Rol                | Equivalente en Python |
| ------------------ | ------------------ | --------------------- |
| TypeScript         | Lenguaje           | Python                |
| Playwright         | Browser automation | Selenium WebDriver    |
| Cucumber.js        | BDD runner         | Behave                |
| `@playwright/test` | Assertions         | `assert`              |

---

## Estructura del proyecto

```
university_playwright/
├── features/
│   └── university_search.feature   ← Escenarios en Gherkin (BDD + DDT)
├── steps/
│   └── university_search_steps.ts  ← Definiciones de pasos con Playwright
├── support/
│   └── world.ts                    ← Hooks Before/After (setup del browser)
├── reports/                        ← Reporte HTML (generado al correr)
├── cucumber.json                   ← Configuración de Cucumber.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## Instalación

```bash
# Requiere Node.js 18+
cd university_playwright

# Instalar dependencias npm
npm install

# Instalar browsers de Playwright (solo Chromium)
npx playwright install chromium
```

---

## Ejecución

```bash
# Modo headless (por defecto, ideal para CI)
npm test

# Ver el navegador mientras corre (debugging)
HEADED=true npm test

# Correr solo el tag @ddt
npx cucumber-js --tags @ddt
```

El reporte HTML se genera en `reports/cucumber-report.html`.

---

## Data Driven Testing – tabla de universidades

La misma prueba se ejecuta para cada fila de la tabla `Examples`:

| Universidad | Búsqueda Google         | Dominio  | Búsqueda interna   | Texto esperado |
| ----------- | ----------------------- | -------- | ------------------ | -------------- |
| ITESO       | iteso.mx                | iteso.mx | carreras           | humanidades    |
| UDG         | udg                     | udg.mx   | oferta academica   | arquitectura   |
| UV          | universidad veracruzana | uv.mx    | nuestros programas | arquitectura   |

Para agregar más universidades:

1. Añade una fila en la tabla `Examples` del `.feature`
2. Agrega su navegación interna en `NAV_STEPS` del steps file
3. Agrega el texto de verificación en `VERIFY_TEXT`

---

## Diferencias clave vs Selenium/Python

| Característica | Selenium (Python)                                | Playwright (TypeScript)                                 |
| -------------- | ------------------------------------------------ | ------------------------------------------------------- |
| Esperas        | `WebDriverWait` + `expected_conditions`          | `waitFor`, `waitForURL`, `waitForLoadState` automáticos |
| Click          | `execute_script("click()")` para evitar overlays | `click()` nativo con auto-scroll                        |
| Nueva pestaña  | `driver.switch_to.window(handle)`                | `context.waitForEvent("page")`                          |
| Assertions     | `assert x in y`                                  | `expect(locator).toContainText()`                       |
| Selectores     | XPath + CSS                                      | CSS + texto (`>> text=`)                                |
