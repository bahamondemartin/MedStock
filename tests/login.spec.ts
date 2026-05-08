import { test, expect } from '@playwright/test'

test.describe('Login flow', () => {
  test('shows magic link login form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'MedStock' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByRole('button', { name: /Enviar enlace mágico/i })).toBeVisible()
  })

  test('submit button is disabled without email', async ({ page }) => {
    await page.goto('/login')
    const button = page.getByRole('button', { name: /Enviar enlace mágico/i })
    await expect(button).toBeDisabled()
  })

  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })
})
