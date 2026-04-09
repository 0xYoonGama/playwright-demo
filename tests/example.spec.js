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

  test('User cannot login with invalid credentials', async ({ page }) => {

    // открыть страницу логина
    await page.goto('https://the-internet.herokuapp.com/login');

    // ввести некорректный логин
    await page.locator('#username').fill('wrong-user');

    // ввести некорректный пароль
    await page.locator('#password').fill('wrong-password');

    // нажать кнопку login
    await page.locator('button[type="submit"]').click();

    // проверка: появился текст об ошибке
    await expect(page.locator('#flash')).toContainText('Your username is invalid!');

    // проверка: пользователь остался на странице логина
    await expect(page).toHaveURL(/login/);
  });

});
