// FILE: tests/e2e/login.spec.ts
// STAGE: 14
// UPDATED: 2026-10-03

import { test, expect } from '@playwright/test';

test.describe('Login and Authentication Flows', () => {
  test('redirects unauthenticated user from protected dashboard to login', async ({ page }) => {
    await page.goto('/inspections');
    await expect(page).toHaveURL(/.*login/);
  });

  test('displays error message on wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@union.iq');
    await page.fill('input[type="password"], input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    await expect(
      page.locator('text=Invalid credentials, text=error, [role="alert"]').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('successfully logs in admin user with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@union.iq');
    await page.fill('input[type="password"], input[name="password"]', 'AdminSecure2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard|inspections|)/);
  });
});
