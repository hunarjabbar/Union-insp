# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> Login and Authentication Flows >> displays error message on wrong password
- Location: tests/e2e/login.spec.ts:13:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Invalid credentials, text=error, [role="alert"]').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=Invalid credentials, text=error, [role="alert"]').first() with timeout 5000ms
  - waiting for locator('text=Invalid credentials, text=error, [role="alert"]').first()

```

```yaml
- heading "Union Inspection" [level=1]
- paragraph: Sign in to continue
- text: Email
- textbox "Email": admin@union.iq
- text: Password
- textbox "Password": WrongPassword123!
- button "Sign in"
- paragraph:
  - link "Cashier PIN login":
    - /url: /login/cashier
- alert
```

# Test source

```ts
  1  | // FILE: tests/e2e/login.spec.ts
  2  | // STAGE: 14
  3  | // UPDATED: 2026-10-03
  4  | 
  5  | import { test, expect } from '@playwright/test';
  6  | 
  7  | test.describe('Login and Authentication Flows', () => {
  8  |   test('redirects unauthenticated user from protected dashboard to login', async ({ page }) => {
  9  |     await page.goto('/inspections');
  10 |     await expect(page).toHaveURL(/.*login/);
  11 |   });
  12 | 
  13 |   test('displays error message on wrong password', async ({ page }) => {
  14 |     await page.goto('/login');
  15 |     await page.fill('input[type="email"], input[name="email"]', 'admin@union.iq');
  16 |     await page.fill('input[type="password"], input[name="password"]', 'WrongPassword123!');
  17 |     await page.click('button[type="submit"]');
  18 |     await expect(
  19 |       page.locator('text=Invalid credentials, text=error, [role="alert"]').first()
> 20 |     ).toBeVisible({ timeout: 5000 });
     |       ^ Error: expect(locator).toBeVisible() failed
  21 |   });
  22 | 
  23 |   test('successfully logs in admin user with valid credentials', async ({ page }) => {
  24 |     await page.goto('/login');
  25 |     await page.fill('input[type="email"], input[name="email"]', 'admin@union.iq');
  26 |     await page.fill('input[type="password"], input[name="password"]', 'AdminSecure2026!');
  27 |     await page.click('button[type="submit"]');
  28 |     await expect(page).toHaveURL(/\/(dashboard|inspections|)/);
  29 |   });
  30 | });
  31 | 
```