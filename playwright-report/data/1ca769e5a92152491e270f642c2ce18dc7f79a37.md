# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reprint-audit.spec.ts >> reprint increments count and writes audit log
- Location: tests/e2e/reprint-audit.spec.ts:7:5

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
  1  | // FILE: tests/e2e/reprint-audit.spec.ts
  2  | // STAGE: 13
  3  | // UPDATED: 2026-10-02
  4  | 
  5  | import { test, expect } from '@playwright/test';
  6  | 
  7  | test('reprint increments count and writes audit log', async ({ page }) => {
  8  |   await page.goto('/login');
  9  |   await page.getByLabel(/email/i).fill('admin@union-inspection.iq');
  10 |   await page.getByLabel(/password/i).fill('Admin#2026!');
  11 |   await page.getByRole('button', { name: /sign in/i }).click();
> 12 |   await page.waitForURL(/\/inspection/);
     |              ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  13 | 
  14 |   await page.goto('/inspection');
  15 |   await page.locator('tbody tr').first().click();
  16 |   await page.waitForURL(/\/inspection\/[^/]+$/);
  17 | 
  18 |   const reprintBtn = page.getByRole('button', { name: /^reprint$/i });
  19 |   if (!(await reprintBtn.count())) {
  20 |     test.skip();
  21 |   }
  22 |   await reprintBtn.click();
  23 |   await page.getByLabel(/reason/i).fill('Original smudged');
  24 |   await page.getByRole('button', { name: /^reprint$/i }).last().click();
  25 |   await expect(page.getByText(/Receipt reprinted/i)).toBeVisible();
  26 | 
  27 |   // Verify via audit log
  28 |   await page.goto('/audit');
  29 |   await expect(page.getByText(/RECEIPT_REPRINTED/).first()).toBeVisible();
  30 | });
  31 | 
```