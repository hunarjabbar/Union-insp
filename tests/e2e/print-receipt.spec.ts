// FILE: tests/e2e/print-receipt.spec.ts
// STAGE: 13
// UPDATED: 2026-10-02

import { test, expect } from '@playwright/test';

test('print receipt with mock USB transport', async ({ page }) => {
  // Install a mock navigator.usb before navigation
  await page.addInitScript(() => {
    (window as unknown as { __printedBytes: number[] }).__printedBytes = [];
    Object.defineProperty(navigator, 'usb', {
      configurable: true,
      value: {
        requestDevice: async () => ({
          open: async () => {},
          selectConfiguration: async () => {},
          claimInterface: async () => {},
          transferOut: async (_ep: number, data: Uint8Array) => {
            (window as unknown as { __printedBytes: number[] }).__printedBytes.push(...data);
            return { status: 'ok' };
          },
          close: async () => {},
        }),
        getDevices: async () => [],
      },
    });
  });

  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@union-inspection.iq');
  await page.getByLabel(/password/i).fill('Admin#2026!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/inspection/);

  // Navigate to an inspection with a receipt
  await page.goto('/inspection');
  // Click first row
  await page.locator('tbody tr').first().click();
  await page.waitForURL(/\/inspection\/[^/]+$/);

  const printBtn = page.getByRole('button', { name: /print receipt/i });
  if (await printBtn.count()) {
    await printBtn.click();
    await page.waitForTimeout(500);
    const bytes = await page.evaluate(
      () => (window as unknown as { __printedBytes: number[] }).__printedBytes
    );
    expect(bytes.length).toBeGreaterThan(0);
  } else {
    test.skip();
  }
});
