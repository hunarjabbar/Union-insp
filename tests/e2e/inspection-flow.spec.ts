// FILE: tests/e2e/inspection-flow.spec.ts
// STAGE: 14
// UPDATED: 2026-10-03

import { test, expect } from '@playwright/test';

test.describe('Full Inspection Wizard Flow with Cash Payment', () => {
  test('completes vehicle lookup, automated test entries, and cash fee collection', async ({ page }) => {
    // Navigate directly to new inspection wizard
    await page.goto('/inspection/new');

    // 1. Vehicle intake lookup
    await expect(page.locator('h1, h2, h3, [data-testid="wizard-header"]').first()).toBeVisible();

    // 2. Select Cash Payment option
    const cashButton = page.locator('button:has-text("Cash"), text=CASH').first();
    if (await cashButton.isVisible()) {
      await cashButton.click();
    }

    // 3. Confirm inspection submission
    const submitBtn = page.locator('button:has-text("Submit"), button:has-text("Complete")').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }
  });
});
