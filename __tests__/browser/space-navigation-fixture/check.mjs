import { chromium } from "@playwright/test";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createServer } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
const evidence = path.join(process.cwd(), ".local/financial-spaces/ui-harness");
mkdirSync(path.join(evidence, "browser-tmp"), { recursive: true });
process.env.TMPDIR = path.join(evidence, "browser-tmp");
writeFileSync(
  path.join(evidence, "report.json"),
  JSON.stringify({ passed: false, status: "running" }),
);
const server = await createServer({
  configFile: fileURLToPath(new URL("./vite.config.mjs", import.meta.url)),
});
await server.listen();
const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
const localChrome =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ??
  (existsSync(localChrome) ? localChrome : undefined);
let browser, page;
const errors = [];
const B = "22222222-2222-4222-8222-222222222222";
try {
  browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  page = await browser.newPage();
  page.setDefaultTimeout(5000);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
  await page.getByRole("heading", { name: "Personnel" }).waitFor();
  await page.getByRole("button", { name: "Sauvegarde retardée" }).click();
  await page.getByText("Enregistrement en attente").waitFor();
  await page.getByRole("combobox").selectOption(B);
  await page.getByRole("heading", { name: "Couple" }).waitFor();
  await page.evaluate(() => window.resolveOldSave());
  await page.waitForTimeout(100);
  if ((await page.getByRole("heading").innerText()) !== "Couple")
    throw Error("Old save changed the displayed space");
  if (
    (await page.evaluate(() => window.navigationRequests)).some((url) =>
      url.endsWith("/depenses"),
    )
  )
    throw Error("Old save navigated after a switch");
  if (await page.evaluate(() => window.refreshes || 0))
    throw Error("Old save refreshed the new space");
  await page.reload();
  await page.getByRole("heading", { name: "Personnel" }).waitFor();
  await page
    .getByRole("textbox", { name: "Nom du brouillon" })
    .fill("Saisie à conserver");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("combobox").selectOption(B);
  if ((await page.getByRole("heading").innerText()) !== "Personnel")
    throw Error("Refused abandonment switched space");
  if ((await page.evaluate(() => window.preferenceRequests)).length)
    throw Error("Refused abandonment changed last-space preference");
  if ((await page.getByRole("textbox").inputValue()) !== "Saisie à conserver")
    throw Error("Draft was lost after refusing abandonment");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("combobox").selectOption(B);
  await page.getByRole("heading", { name: "Couple" }).waitFor();
  if ((await page.getByRole("textbox").inputValue()) !== "")
    throw Error("Draft leaked into the new space");
  await page.reload();
  await page.getByRole("heading", { name: "Personnel" }).waitFor();
  await page.getByRole("button", { name: "Fréquence annuelle" }).click();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("combobox").selectOption(B);
  if ((await page.getByRole("heading").innerText()) !== "Personnel")
    throw Error("Button-based field draft was abandoned without approval");
  if ((await page.evaluate(() => window.preferenceRequests)).length)
    throw Error("Button draft refusal changed preference");
  await page.reload();
  await page.getByRole("heading", { name: "Personnel" }).waitFor();
  await page.evaluate(() => {
    window.deferRemember = true;
  });
  await page.getByRole("combobox").selectOption(B);
  await page.waitForFunction(
    () => typeof window.resolveRemember === "function",
  );
  await page.getByRole("button", { name: "Compte" }).click();
  await page.getByRole("heading", { name: "Compte" }).waitFor();
  await page.evaluate(() => window.resolveRemember());
  await page.waitForTimeout(100);
  if ((await page.evaluate(() => window.navigationRequests)).length)
    throw Error(
      "Unmounted selector navigated after delayed preference response",
    );
  await page.goto(origin + "/?creation");
  await page.getByRole("heading", { name: "Création isolée" }).waitFor();
  await page.evaluate(() => {
    window.deferCreation = true;
  });
  await page.getByLabel("NOM DE L’ESPACE").fill("Création différée");
  await page.getByRole("radio", { name: "Non, pour moi uniquement" }).check();
  await page.getByRole("button", { name: "Créer mon espace" }).click();
  await page.waitForFunction(
    () => typeof window.resolveCreation === "function",
  );
  await page.getByRole("button", { name: "Fermer le formulaire" }).click();
  await page.evaluate(() => window.resolveCreation());
  await page.waitForTimeout(100);
  if (await page.evaluate(() => window.creationCallbacks || 0))
    throw Error("Closed creation form navigated from a late response");
  if ((await page.evaluate(() => window.creationRequests)).length !== 1)
    throw Error("Creation request duplicated");
  if (errors.length) throw Error(errors.join("\n"));
  const report = {
    passed: true,
    scope:
      "Real SpaceProvider/SpaceSelector/guarded router in Chrome; auth/action/router service edges simulated. Not full app E2E or Playwright MCP.",
    checks: [
      "late save cannot navigate or refresh B",
      "declined draft abandonment keeps A, draft and preference",
      "accepted abandonment opens B with empty form",
      "button-based field draft also requires abandonment approval",
      "delayed preference response cannot navigate after selector unmount",
      "closed creation form cannot trigger parent navigation after late completion",
    ],
    pageErrors: errors,
  };
  writeFileSync(
    ".local/financial-spaces/ui-harness/report.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
} catch (error) {
  writeFileSync(
    path.join(evidence, "report.json"),
    JSON.stringify({ passed: false, status: "failed", error: String(error) }),
  );
  console.error(
    JSON.stringify({ errors, html: page ? await page.content() : null }),
  );
  throw error;
} finally {
  await browser?.close();
  await server.close();
}
