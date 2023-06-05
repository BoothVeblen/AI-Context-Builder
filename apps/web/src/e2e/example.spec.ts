import { expect, test } from '@playwright/test'

test('should navigate to the sign in page', async ({ page }) => {
  await page.goto('/sign-in')
  await expect(page).toHaveURL(/.*sign-in/)
  await page.click('text=Sign up')
  await expect(page).toHaveURL(/.*sign-up/)
  await expect(page.locator('h1')).toContainText('Create your account')
})
