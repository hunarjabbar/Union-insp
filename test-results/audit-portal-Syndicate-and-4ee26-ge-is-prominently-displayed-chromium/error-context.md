# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: audit-portal.spec.ts >> Syndicate and Regulatory Audit Portal >> verifies "Audit Chain Verified" cryptographic badge is prominently displayed
- Location: tests/e2e/audit-portal.spec.ts:8:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Audit Chain Verified, text=Chain Valid, text=Tamper-Evident').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=Audit Chain Verified, text=Chain Valid, text=Tamper-Evident').first() with timeout 10000ms
  - waiting for locator('text=Audit Chain Verified, text=Chain Valid, text=Tamper-Evident').first()

```

```yaml
- heading "Union Inspection" [level=1]
- paragraph: Sign in to continue
- text: Email
- textbox "Email"
- text: Password
- textbox "Password"
- button "Sign in"
- paragraph:
  - link "Cashier PIN login":
    - /url: /login/cashier
- alert
```

# Test source

```ts
  1  | // FILE: tests/e2e/audit-portal.spec.ts
  2  | // STAGE: 14
  3  | // UPDATED: 2026-10-03
  4  | 
  5  | import { test, expect } from '@playwright/test';
  6  | 
  7  | test.describe('Syndicate and Regulatory Audit Portal', () => {
  8  |   test('verifies "Audit Chain Verified" cryptographic badge is prominently displayed', async ({ page }) => {
  9  |     await page.goto('/audit');
  10 |     await expect(
  11 |       page.locator('text=Audit Chain Verified, text=Chain Valid, text=Tamper-Evident').first()
> 12 |     ).toBeVisible({ timeout: 10000 });
     |       ^ Error: expect(locator).toBeVisible() failed
  13 |   });
  14 | });
  15 | 
```