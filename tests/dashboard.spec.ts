import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('dashboard loads and shows the intake form', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /plan it\. build it anywhere/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /generate build blueprint/i })).toBeVisible();
});

test('health endpoint responds with provider status', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body).toHaveProperty('providers');
  expect(body).toHaveProperty('ok', true);
});

test('orchestrate endpoint returns structured blueprint', async ({ request }) => {
  const res = await request.post('/api/orchestrate', {
    data: {
      problemStatement: 'Build a decentralized real-time IoT water monitoring dashboard.',
      projectType: 'iot',
      provider: 'simulated'
    }
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body).toHaveProperty('requirements');
  expect(body).toHaveProperty('architecture');
  expect(body.requirements.length).toBeGreaterThan(0);
});

test('score endpoint computes readiness score', async ({ request }) => {
  const res = await request.post('/api/score', {
    data: {
      requirements: [
        { id: 'REQ-01', requirement: 'Intake UI', priority: 'must', suggestedFeature: 'UI', evidence: null, testStatus: 'passing' }
      ]
    }
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body).toHaveProperty('overall');
  expect(body).toHaveProperty('categories');
});

test('dashboard has no critical accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
});
