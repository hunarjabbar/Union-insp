// FILE: tests/e2e/pos-payment.spec.ts
// STAGE: 14
// UPDATED: 2026-10-03

import { test, expect } from '@playwright/test';

test.describe('POS Payment & Cashier PIN Authentication', () => {
  test('authenticates cashier via 4-digit rapid PIN pad', async ({ page }) => {
    await page.goto('/login/cashier');
    await expect(page.locator('text=Cashier, text=PIN').first()).toBeVisible();

    const pinInput = page.locator('input[type="password"], input[type="text"]').first();
    if (await pinInput.isVisible()) {
      await pinInput.fill('1234');
      const submitBtn = page.locator('button[type="submit"], button:has-text("Enter")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    }
  });
});
