import { test, expect } from '@playwright/test';

test.describe('Customer flow', () => {
  test('can view pizzeria menu page', async ({ page }) => {
    await page.goto('/pizza-roma');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('can see WhatsApp order button', async ({ page }) => {
    await page.goto('/pizza-roma');
    const waLink = page.locator('a[href*="wa.me"]');
    await expect(waLink).toBeVisible();
  });
});

test.describe('Admin flow', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });
});
