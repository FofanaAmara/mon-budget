import { chromium, expect } from '@playwright/test';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const evidence = path.join(process.cwd(), '.local/financial-spaces/verification-harness');
mkdirSync(path.join(evidence, 'browser-tmp'), { recursive: true });
process.env.TMPDIR = path.join(evidence, 'browser-tmp');
const reportFile = path.join(evidence, 'report.json');
writeFileSync(reportFile, JSON.stringify({ passed: false, status: 'running' }));
const server = await createServer({ configFile: fileURLToPath(new URL('./vite.config.mjs', import.meta.url)) });
let browser;
const errors = [];
try {
  await server.listen();
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? (existsSync(localChrome) ? localChrome : undefined);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  page.on('pageerror', (error) => errors.push(error.message));
  const open = async () => {
    await page.goto(origin + '/verification.html');
    await page.getByRole('button', { name: 'Recevoir un code de vérification', exact: true }).waitFor();
  };
  const settle = async (result) => {
    await page.evaluate((value) => window.resolveVerification(value), result);
    await page.getByRole('button', { name: 'En cours…', exact: true }).waitFor({ state: 'hidden' });
  };
  await open();
  expect(await page.evaluate(() => window.verificationCalls)).toEqual([]);
  await page.getByRole('button', { name: 'J’ai déjà un code', exact: true }).click();
  const code = page.getByRole('textbox', { name: 'Code reçu par courriel', exact: true });
  const verify = page.getByRole('button', { name: 'Vérifier mon adresse', exact: true });
  await code.fill('123'); await expect(verify).toBeDisabled();
  await code.fill(' 123456 '); await expect(code).toHaveValue('123456');
  await expect(verify).toBeEnabled();
  await verify.click();
  await expect(page.getByRole('button', { name: 'En cours…', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => window.verificationCalls)).toHaveLength(1);
  await settle({ ok: false, error: 'Code incorrect ou expiré.' });
  await expect(page.getByRole('alert')).toContainText('Code incorrect');
  expect(page.url()).toBe(origin + '/verification.html');

  await open();
  await page.getByRole('button', { name: 'Recevoir un code de vérification', exact: true }).click();
  await settle({ ok: false, error: 'Envoi non confirmé : un courriel peut arriver.' });
  await expect(page.getByRole('alert')).toContainText('non confirmé');
  await expect(page.getByRole('button', { name: /Renvoyer un code dans/ })).toBeDisabled();
  await expect(page.getByRole('textbox', { name: 'Code reçu par courriel', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => window.verificationCalls)).toHaveLength(1);

  for (const action of ['Fermer la vérification', 'Changer la session de test']) {
    await open();
    await page.getByRole('button', { name: 'Recevoir un code de vérification', exact: true }).click();
    await page.getByRole('button', { name: action, exact: true }).click();
    await settle({ ok: true, status: 'verified' });
    expect(page.url()).toBe(origin + '/verification.html');
    if (action.startsWith('Changer')) await expect(page.getByRole('alert')).toContainText('session');
  }

  await open();
  const destination = '/invitation/11111111-1111-4111-8111-111111111111.' + 'a'.repeat(43);
  await page.route('**/invitation/**', (route) => route.fulfill({ contentType: 'text/html', body: '<main>Invitation à accepter explicitement</main>' }));
  await page.getByRole('button', { name: 'Recevoir un code de vérification', exact: true }).click();
  await page.evaluate(() => window.resolveVerification({ ok: true, status: 'verified' }));
  await page.waitForURL(origin + destination);
  await expect(page.getByRole('main')).toContainText('accepter explicitement');
  if (errors.length) throw Error(errors.join('\n'));
  const report = { passed: true, scope: 'Real InvitationVerification in Chromium; Auth/action responses and final destination simulated. No OTP email, membership, full app E2E or Playwright MCP proof.', checks: ['no send on mount', 'short/trimmed code and pending controls', 'failed verification stays on invitation', 'uncertain delivery allows code entry and enforces UI cooldown', 'late completion after unmount cannot navigate', 'late completion after actor change cannot navigate', 'verified response reloads the exact invitation without accepting it'], pageErrors: errors };
  writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} catch (error) {
  writeFileSync(reportFile, JSON.stringify({ passed: false, error: String(error), pageErrors: errors }, null, 2));
  throw error;
} finally {
  await browser?.close();
  await server.close();
}
