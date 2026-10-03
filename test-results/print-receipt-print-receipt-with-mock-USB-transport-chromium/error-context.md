# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: print-receipt.spec.ts >> print receipt with mock USB transport
- Location: tests/e2e/print-receipt.spec.ts:7:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - heading "Union Inspection" [level=1] [ref=e5]
    - paragraph [ref=e6]: Sign in to continue
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]: Email
        - textbox "Email" [ref=e10]: admin@union-inspection.iq
      - generic [ref=e11]:
        - generic [ref=e12]: Password
        - textbox "Password" [ref=e13]: Admin#2026!
      - button "Sign in" [ref=e14] [cursor=pointer]
    - paragraph [ref=e15]:
      - link "Cashier PIN login" [ref=e16] [cursor=pointer]:
        - /url: /login/cashier
  - alert [ref=e17]
```

# Test source

```ts
  1  | // FILE: tests/e2e/print-receipt.spec.ts
  2  | // STAGE: 13
  3  | // UPDATED: 2026-10-02
  4  | 
  5  | import { test, expect } from '@playwright/test';
  6  | 
  7  | test('print receipt with mock USB transport', async ({ page }) => {
  8  |   // Install a mock navigator.usb before navigation
  9  |   await page.addInitScript(() => {
  10 |     (window as unknown as { __printedBytes: number[] }).__printedBytes = [];
  11 |     Object.defineProperty(navigator, 'usb', {
  12 |       configurable: true,
  13 |       value: {
  14 |         requestDevice: async () => ({
  15 |           open: async () => {},
  16 |           selectConfiguration: async () => {},
  17 |           claimInterface: async () => {},
  18 |           transferOut: async (_ep: number, data: Uint8Array) => {
  19 |             (window as unknown as { __printedBytes: number[] }).__printedBytes.push(...data);
  20 |             return { status: 'ok' };
  21 |           },
  22 |           close: async () => {},
  23 |         }),
  24 |         getDevices: async () => [],
  25 |       },
  26 |     });
  27 |   });
  28 | 
  29 |   await page.goto('/login');
  30 |   await page.getByLabel(/email/i).fill('admin@union-inspection.iq');
  31 |   await page.getByLabel(/password/i).fill('Admin#2026!');
  32 |   await page.getByRole('button', { name: /sign in/i }).click();
> 33 |   await page.waitForURL(/\/inspection/);
     |              ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  34 | 
  35 |   // Navigate to an inspection with a receipt
  36 |   await page.goto('/inspection');
  37 |   // Click first row
  38 |   await page.locator('tbody tr').first().click();
  39 |   await page.waitForURL(/\/inspection\/[^/]+$/);
  40 | 
  41 |   const printBtn = page.getByRole('button', { name: /print receipt/i });
  42 |   if (await printBtn.count()) {
  43 |     await printBtn.click();
  44 |     await page.waitForTimeout(500);
  45 |     const bytes = await page.evaluate(
  46 |       () => (window as unknown as { __printedBytes: number[] }).__printedBytes
  47 |     );
  48 |     expect(bytes.length).toBeGreaterThan(0);
  49 |   } else {
  50 |     test.skip();
  51 |   }
  52 | });
  53 | 
```