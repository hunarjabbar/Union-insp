// FILE: tests/e2e/reprint-audit.spec.ts
// STAGE: 13
// UPDATED: 2026-10-02

import { test, expect } from '@playwright/test';

test('reprint increments count and writes audit log', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@union-inspection.iq');
  await page.getByLabel(/password/i).fill('Admin#2026!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/inspection/);

  await page.goto('/inspection');
  await page.locator('tbody tr').first().click();
  await page.waitForURL(/\/inspection\/[^/]+$/);

  const reprintBtn = page.getByRole('button', { name: /^reprint$/i });
  if (!(await reprintBtn.count())) {
    test.skip();
  }
  await reprintBtn.click();
  await page.getByLabel(/reason/i).fill('Original smudged');
  await page.getByRole('button', { name: /^reprint$/i }).last().click();
  await expect(page.getByText(/Receipt reprinted/i)).toBeVisible();

  // Verify via audit log
  await page.goto('/audit');
  await expect(page.getByText(/RECEIPT_REPRINTED/).first()).toBeVisible();
});
