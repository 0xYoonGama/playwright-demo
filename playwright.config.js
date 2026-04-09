// 2) playwright.config.ts
// Ниже — адаптированная версия твоего конфига с подробными комментариями.
// Сразу исправлю один важный момент:
// у тебя файл называется playwright.config.ts, но внутри стоит
//     // @ts-check
// Это директива для JS-файлов. Для .ts она не нужна.
// Также я добавил baseURL и чуть подправил reporter.
// Конфиг остаётся мультибраузерным, но теперь подходит и для API-тестов Basic Auth.

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Корневая папка с тестами.
  // Playwright будет искать spec-файлы внутри ./tests и всех вложенных папок.
  // Поэтому файл tests/api/basic-auth.spec.ts будет автоматически подхвачен.
  testDir: './tests',

  // Разрешает запуск тестов параллельно.
  // Для твоего Basic Auth suite это нормально, тесты независимые.
  fullyParallel: true,

  // Если в CI случайно оставить test.only, сборка упадёт.
  // Это хорошая защитная практика.
  forbidOnly: !!process.env.CI,

  // Повторы тестов только на CI.
  // Локально 0 retries, чтобы не маскировать нестабильность.
  retries: process.env.CI ? 2 : 0,

  // На CI ограничиваем количество workers до 1,
  // чтобы сделать выполнение более предсказуемым.
  // Локально Playwright сам выберет оптимальное число.
  workers: process.env.CI ? 1 : undefined,

  // Репортеры.
  // 'list' удобно читать прямо в терминале.
  // 'html' даёт HTML-отчёт после прогона.
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  // Общие настройки по умолчанию для всех проектов.
  use: {
    // Базовый URL.
    // Теперь в тестах можно писать request.get('/basic_auth'),
    // а не полный URL целиком.
    baseURL: 'https://the-internet.herokuapp.com',

    // Собирать trace только при первом ретрае.
    // Для API-тестов trace обычно не так важен, как для UI,
    // но можно оставить — вреда нет.
    trace: 'on-first-retry',

    // Дополнительный общий Accept header.
    // Не обязателен, но помогает сделать запросы ближе к реальным браузерным.
    extraHTTPHeaders: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  },

  // Проекты — это матрица запусков.
  // Для чистых API-тестов браузеры по факту не нужны, потому что используется request fixture.
  // Но раз у тебя уже есть стандартный шаблон Playwright, можно оставить как есть.
  // Тогда один и тот же suite будет запускаться в chromium/firefox/webkit проектах.
  // Это не даёт большого смысла именно для API, но и не ломает ничего.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Блок webServer не нужен, потому что ты тестируешь внешний сайт,
  // а не локальное приложение.
  // Поэтому оставляем его отключённым.
});