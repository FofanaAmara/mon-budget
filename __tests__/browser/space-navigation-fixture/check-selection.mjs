import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { createServer } from "vite";

const root = process.cwd();
const evidence = path.join(root, ".local/financial-spaces/selection-harness");
mkdirSync(path.join(evidence, "browser-tmp"), { recursive: true });
process.env.TMPDIR = path.join(evidence, "browser-tmp");
const report = { passed: false, checks: [], scope: "Real React parent and sheets; refreshed props and financial service edges simulated. No hosted Auth, database, or Playwright MCP proof." };
const save = () => writeFileSync(path.join(evidence, "report.json"), JSON.stringify(report, null, 2));
save();
const server = await createServer({
  configFile: fileURLToPath(new URL("./vite.config.mjs", import.meta.url)),
  plugins: [{
    name: "selection-financial-service-edges",
    enforce: "pre",
    resolveId(id) {
      for (const prefix of ["@/lib/actions/financial/", path.join(root, "lib/actions/financial/")]) {
        if (id.startsWith(prefix)) return `\0selection-service:${id.slice(prefix.length)}`;
      }
    },
    load(id) {
      if (!id.startsWith("\0selection-service:")) return;
      const name = id.slice("\0selection-service:".length).replace(/\.ts$/, "");
      const source = readFileSync(path.join(root, "lib/actions/financial", `${name}.ts`), "utf8");
      // Replace only the server-action boundary; no database module enters this fixture.
      return [...source.matchAll(/export async function (\w+)/g)]
        .map((match) => `export async function ${match[1]}() { return []; }`).join("\n");
    },
  }],
});
let browser;
try {
  await server.listen();
  const origin = `http://127.0.0.1:${server.httpServer.address().port}/selection.html`;
  const localChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? (existsSync(localChrome) ? localChrome : undefined);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const open = async () => {
    await page.goto(origin);
    await page.getByText("Dette de recette", { exact: true }).waitFor();
  };

  await open();
  await page.getByRole("button", { name: "Payer", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "Payer une dette" });
  await dialog.getByRole("spinbutton", { name: "Montant", exact: true }).fill("75.25");
  await page.getByRole("button", { name: "Actualiser les données" }).click();
  await dialog.getByText("525,50 $", { exact: true }).waitFor();
  assert.equal(await dialog.getByRole("spinbutton", { name: "Montant", exact: true }).inputValue(), "75.25");
  await dialog.getByText("450,25 $", { exact: true }).waitFor();
  report.checks.push("open payment follows refreshed balance and preserves entered amount");

  await open();
  const projectCard = page.locator("div").filter({ has: page.getByText("Objectif de recette", { exact: true }) }).filter({ has: page.getByRole("button", { name: "Historique", exact: true }) }).last();
  await projectCard.getByRole("button", { name: "Historique", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Historique", exact: true });
  await page.getByRole("button", { name: "Actualiser les données" }).click();
  await dialog.getByText(/Total : 200,00/).waitFor();
  assert.ok(!(await dialog.innerText()).includes("123,45"));
  report.checks.push("open savings history follows refreshed pot balance");

  await open();
  await page.getByRole("button", { name: "Payer", exact: true }).click();
  await page.getByRole("button", { name: "Retirer la dette" }).click();
  await page.getByRole("dialog", { name: "Payer une dette" }).waitFor({ state: "hidden" });
  report.checks.push("removed debt cannot remain open as a stale payment target");
  assert.deepEqual(errors, []);
  report.passed = true;
  save();
  console.log(JSON.stringify(report));
} catch (error) {
  report.error = error.message;
  save();
  throw error;
} finally {
  await browser?.close();
  await server.close();
}
