import { test, expect } from '@playwright/test';

test.describe('Login flow', () => {

  test('User can login with valid credentials', async ({ page }) => {

    // открыть страницу логина
    await page.goto('https://the-internet.herokuapp.com/login');

    // ввести логин
    await page.locator('#username').fill('tomsmith');

    // ввести пароль
    await page.locator('#password').fill('SuperSecretPassword!');

    // нажать кнопку login
    await page.locator('button[type="submit"]').click();

    // проверка: появился успешный текст
    await expect(page.locator('#flash')).toContainText('You logged into a secure area!');

    // проверка: URL изменился
    await expect(page).toHaveURL(/secure/);
  });

});