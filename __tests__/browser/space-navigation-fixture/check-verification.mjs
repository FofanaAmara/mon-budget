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
  const open = async (query = '') => {
    await page.goto(origin + '/verification.html' + query);
    await page.getByRole('button', { name: 'Accepter l’invitation', exact: true }).waitFor();
  };
  const settle = async result => {
    await page.evaluate(value => window.resolveInvitationResponse(value), result);
    await page.getByRole('button', { name: 'En cours…', exact: true }).waitFor({ state: 'hidden' });
  };
  const id = '11111111-1111-4111-8111-111111111111';
  const token = id + '.' + 'a'.repeat(43);
  await open();
  expect(await page.evaluate(() => window.invitationResponseCalls)).toEqual([]);
  expect(await page.getByRole('textbox').count()).toBe(0);
  await page.getByRole('button', { name: 'Accepter l’invitation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'En cours…', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Refuser', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => window.invitationResponseCalls)).toEqual([{ id, response: 'accept', token }]);
  await settle({ ok: false, error: 'Invitation indisponible pour ce compte.' });
  await expect(page.getByRole('alert')).toContainText('indisponible');
  await page.getByRole('button', { name: 'Accepter l’invitation', exact: true }).click();
  expect(await page.evaluate(() => window.invitationResponseCalls)).toHaveLength(2);
  await settle({ ok: true, data: { accepted: true, spaceId: 'shared', spaceName: 'Notre couple' } });
  await expect(page.getByText('Tu as rejoint « Notre couple ».')).toBeVisible();
  expect(await page.evaluate(() => window.acceptanceNavigation)).toEqual(['/invitations/' + id]);
  await page.screenshot({ path: path.join(evidence, 'accepted-without-otp.png') });

  await open('?inbox');
  await page.getByRole('button', { name: 'Refuser', exact: true }).click();
  expect(await page.evaluate(() => window.invitationResponseCalls)).toEqual([{ id, response: 'decline' }]);
  await settle({ ok: true, data: { accepted: false, spaceId: 'shared', spaceName: 'Notre couple' } });
  await expect(page.getByText('Invitation refusée. Aucun accès à cet espace n’a été ajouté.')).toBeVisible();

  await open();
  await page.getByRole('button', { name: 'Accepter l’invitation', exact: true }).click();
  await page.getByRole('button', { name: 'Fermer l’invitation', exact: true }).click();
  await page.evaluate(() => window.resolveInvitationResponse({ ok: true, data: { accepted: true, spaceId: 'shared', spaceName: 'Notre couple' } }));
  expect(await page.evaluate(() => window.acceptanceNavigation)).toEqual([]);
  if (errors.length) throw Error(errors.join('\n'));
  const report = { passed: true, scope: 'Real InvitationResponse in Chromium; action responses and router simulated. No OTP, Auth email, full-app E2E or Playwright MCP claim.', checks: ['no response on mount and no code field', 'original mail token submitted on explicit acceptance', 'only in-flight controls disabled', 'failure permits retry', 'private-inbox response without token remains server-authorized', 'confirmation and decline', 'late response after unmount cannot navigate'], pageErrors: errors };
  writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} catch (error) {
  writeFileSync(reportFile, JSON.stringify({ passed: false, error: String(error), pageErrors: errors }, null, 2));
  throw error;
} finally {
  await browser?.close();
  await server.close();
}
