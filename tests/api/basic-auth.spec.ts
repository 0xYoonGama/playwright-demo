// tests/api/basic-auth.spec.ts
// Suite проверяет HTTP Basic Authentication на уровне протокола (API),
// без участия UI, popup и browser-driven логики.
// Проверяется контракт сервера: status codes, headers, auth flow и устойчивость к некорректным данным.

import { test, expect } from '@playwright/test';

// Endpoint под тестированием.
// Используется baseURL из playwright.config.ts
const endpoint = '/basic_auth';

/**
 * Формирует значение Authorization header для Basic Auth.
 *
 * RFC логика:
 * 1. Берём строку: username:password
 * 2. Кодируем в Base64
 * 3. Добавляем префикс "Basic "
 *
 * Пример:
 *   admin:admin -> YWRtaW46YWRtaW4=
 *   Authorization: Basic YWRtaW46YWRtaW4=
 */
function toBasicAuth(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

test.describe('Basic Auth - the-internet.herokuapp.com', () => {

  // =========================
  // 🔒 Authentication challenge
  // =========================
  test.describe('Authentication challenge (no credentials)', () => {

    test('should return 401 without Authorization header', async ({ request }) => {
      // Первый запрос без credentials
      const response = await request.get(endpoint);

      // Сервер обязан вернуть 401
      expect(response.status()).toBe(401);
    });

    test('should include WWW-Authenticate header with Basic realm', async ({ request }) => {
      const response = await request.get(endpoint);

      expect(response.status()).toBe(401);

      const headers = response.headers();

      // Проверка наличия challenge header
      expect(headers['www-authenticate']).toBeTruthy();

      // Проверка конкретного значения realm
      expect(headers['www-authenticate']).toBe('Basic realm="Restricted Area"');
    });

  });

  // =========================
  // ✅ Valid credentials
  // =========================
  test.describe('Valid credentials', () => {

    test('should return 200 with valid basic auth credentials', async ({ request }) => {
      const response = await request.get(endpoint, {
        headers: {
          Authorization: toBasicAuth('admin', 'admin'),
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.text();

      // Проверка бизнес-результата (не только статус-кода)
      expect(body).toContain('Congratulations!');
    });

  });

  // =========================
  // ❌ Invalid credentials
  // =========================
  test.describe('Invalid credentials', () => {

    test('should return 401 with invalid password', async ({ request }) => {
      const response = await request.get(endpoint, {
        headers: {
          Authorization: toBasicAuth('admin', 'wrong-password'),
        },
      });

      expect(response.status()).toBe(401);

      // Сервер должен снова инициировать challenge
      expect(response.headers()['www-authenticate'])
        .toBe('Basic realm="Restricted Area"');
    });

    test('should return 401 with invalid username', async ({ request }) => {
      const response = await request.get(endpoint, {
        headers: {
          Authorization: toBasicAuth('wrong-user', 'admin'),
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should return 401 with both username and password invalid', async ({ request }) => {
      const response = await request.get(endpoint, {
        headers: {
          Authorization: toBasicAuth('wrong-user', 'wrong-password'),
        },
      });

      expect(response.status()).toBe(401);
    });

  });

  // =========================
  // ⚙️ Protocol edge cases
  // =========================
  test.describe('Protocol edge cases', () => {

    test('should return 401 when Authorization scheme is not Basic', async ({ request }) => {
      const response = await request.get(endpoint, {
        headers: {
          Authorization: 'Bearer some-token',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should return 401 with malformed base64 credentials', async ({ request }) => {
      const response = await request.get(endpoint, {
        headers: {
          // Некорректный base64
          Authorization: 'Basic invalid_base64!!!',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should return 401 with empty credentials', async ({ request }) => {
      const response = await request.get(endpoint, {
        headers: {
          // ":" → пустой user и password
          Authorization: `Basic ${Buffer.from(':').toString('base64')}`,
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should return 401 when Basic prefix is missing', async ({ request }) => {
      const response = await request.get(endpoint, {
        headers: {
          // base64 есть, но нет "Basic "
          Authorization: Buffer.from('admin:admin').toString('base64'),
        },
      });

      expect(response.status()).toBe(401);
    });

  });

  // =========================
  // 🔁 Auth flow
  // =========================
  test.describe('Challenge-response flow', () => {

    test('should follow challenge-response flow (401 → 200)', async ({ request }) => {
      // Шаг 1: без credentials
      const firstResponse = await request.get(endpoint);
      expect(firstResponse.status()).toBe(401);

      // Шаг 2: с credentials
      const secondResponse = await request.get(endpoint, {
        headers: {
          Authorization: toBasicAuth('admin', 'admin'),
        },
      });

      expect(secondResponse.status()).toBe(200);
    });

  });

});