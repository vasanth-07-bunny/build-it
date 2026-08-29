import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('dashboard loads and shows the intake form', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /plan it\. build it anywhere/i })).toBeVisible();
  await expect(page.getByPlaceholder(/paste the hackathon problem statement/i)).toBeVisible();
});

test('health endpoint responds', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body).toHaveProperty('providers');
});

test('dashboard has no critical accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
});
