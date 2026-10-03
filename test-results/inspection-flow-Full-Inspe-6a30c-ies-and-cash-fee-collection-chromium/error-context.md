# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: inspection-flow.spec.ts >> Full Inspection Wizard Flow with Cash Payment >> completes vehicle lookup, automated test entries, and cash fee collection
- Location: tests/e2e/inspection-flow.spec.ts:8:7

# Error details

```
Error: page.goto: net::ERR_EMPTY_RESPONSE at http://localhost:3000/inspection/new
Call log:
  - navigating to "http://localhost:3000/inspection/new", waiting until "load"

```

# Test source

```ts
  1  | // FILE: tests/e2e/inspection-flow.spec.ts
  2  | // STAGE: 14
  3  | // UPDATED: 2026-10-03
  4  | 
  5  | import { test, expect } from '@playwright/test';
  6  | 
  7  | test.describe('Full Inspection Wizard Flow with Cash Payment', () => {
  8  |   test('completes vehicle lookup, automated test entries, and cash fee collection', async ({ page }) => {
  9  |     // Navigate directly to new inspection wizard
> 10 |     await page.goto('/inspection/new');
     |                ^ Error: page.goto: net::ERR_EMPTY_RESPONSE at http://localhost:3000/inspection/new
  11 | 
  12 |     // 1. Vehicle intake lookup
  13 |     await expect(page.locator('h1, h2, h3, [data-testid="wizard-header"]').first()).toBeVisible();
  14 | 
  15 |     // 2. Select Cash Payment option
  16 |     const cashButton = page.locator('button:has-text("Cash"), text=CASH').first();
  17 |     if (await cashButton.isVisible()) {
  18 |       await cashButton.click();
  19 |     }
  20 | 
  21 |     // 3. Confirm inspection submission
  22 |     const submitBtn = page.locator('button:has-text("Submit"), button:has-text("Complete")').first();
  23 |     if (await submitBtn.isVisible()) {
  24 |       await submitBtn.click();
  25 |     }
  26 |   });
  27 | });
  28 | 
```