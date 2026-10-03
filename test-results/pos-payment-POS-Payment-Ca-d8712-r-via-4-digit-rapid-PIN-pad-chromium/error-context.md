# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pos-payment.spec.ts >> POS Payment & Cashier PIN Authentication >> authenticates cashier via 4-digit rapid PIN pad
- Location: tests/e2e/pos-payment.spec.ts:8:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Cashier, text=PIN').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=Cashier, text=PIN').first() with timeout 5000ms
  - waiting for locator('text=Cashier, text=PIN').first()

```

```yaml
- heading "Cashier PIN login" [level=1]
- paragraph: Shared terminal login for cashiers.
- text: Station
- combobox:
  - option "Select station…" [selected]
  - option "Sulaymaniyah Border Station 1"
  - option "Bashmakh Border Terminal"
  - option "Parvez Khan Terminal"
  - option "Sulaymaniyah City Center 1"
  - option "Sulaymaniyah City Center 2"
- text: 6-digit PIN
- textbox
- button "Sign in" [disabled]
- alert
```

# Test source

```ts
  1  | // FILE: tests/e2e/pos-payment.spec.ts
  2  | // STAGE: 14
  3  | // UPDATED: 2026-10-03
  4  | 
  5  | import { test, expect } from '@playwright/test';
  6  | 
  7  | test.describe('POS Payment & Cashier PIN Authentication', () => {
  8  |   test('authenticates cashier via 4-digit rapid PIN pad', async ({ page }) => {
  9  |     await page.goto('/login/cashier');
> 10 |     await expect(page.locator('text=Cashier, text=PIN').first()).toBeVisible();
     |                                                                  ^ Error: expect(locator).toBeVisible() failed
  11 | 
  12 |     const pinInput = page.locator('input[type="password"], input[type="text"]').first();
  13 |     if (await pinInput.isVisible()) {
  14 |       await pinInput.fill('1234');
  15 |       const submitBtn = page.locator('button[type="submit"], button:has-text("Enter")').first();
  16 |       if (await submitBtn.isVisible()) {
  17 |         await submitBtn.click();
  18 |       }
  19 |     }
  20 |   });
  21 | });
  22 | 
```