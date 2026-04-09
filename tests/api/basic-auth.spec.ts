// 2) tests/api/basic-auth.spec.ts
// Ниже готовый suite с подробными комментариями.
// Он проверяет именно HTTP Basic Auth на уровне API/protocol,
// а не popup браузера и не UI-форму.

import { test, expect } from '@playwright/test';

// Отдельная константа для endpoint.
// Так проще поддерживать тесты и переиспользовать путь.
const endpoint = '/basic_auth';

/**
 * Утилита для сборки значения Authorization header для Basic Auth.
 *
 * По стандарту Basic Auth credentials передаются так:
 *   username:password
 * потом строка кодируется в Base64,
 * и результат вставляется в header:
 *   Authorization: Basic <base64>
 *
 * Пример:
 *   admin:admin -> YWRtaW46YWRtaW4=
 *   Authorization: Basic YWRtaW46YWRtaW4=
 */
function toBasicAuth(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

test.describe('Basic Auth - the-internet.herokuapp.com', () => {
  test('should return 401 without Authorization header', async ({ request }) => {
    // Делаем запрос к защищённому endpoint без credentials.
    // Это имитирует самый первый заход пользователя на страницу.
    const response = await request.get(endpoint);

    // Ожидаем 401 Unauthorized.
    // Это правильное поведение для ресурса, защищённого Basic Auth.
    expect(response.status()).toBe(401);
  });

  test('should return WWW-Authenticate header with Basic realm', async ({ request }) => {
    // Снова делаем запрос без auth.
    const response = await request.get(endpoint);

    // Сервер должен ответить 401.
    expect(response.status()).toBe(401);

    // Извлекаем заголовки ответа.
    // В Playwright response.headers() возвращает объект:
    // { 'content-type': '...', 'www-authenticate': '...' }
    const headers = response.headers();

    // Проверяем, что сервер действительно прислал challenge header.
    // Это обязательная часть Basic Auth handshake.
    expect(headers['www-authenticate']).toBeTruthy();

    // Проверяем точное значение.
    // В данном demo-сайте realm ожидается "Restricted Area".
    expect(headers['www-authenticate']).toBe('Basic realm="Restricted Area"');
  });

  test('should return 200 with valid basic auth credentials', async ({ request }) => {
    // Делаем запрос уже с валидным Authorization header.
    const response = await request.get(endpoint, {
      headers: {
        Authorization: toBasicAuth('admin', 'admin'),
      },
    });

    // При корректных credentials ожидаем успешный ответ.
    expect(response.status()).toBe(200);

    // Для дополнительной уверенности можно проверить тело ответа.
    const body = await response.text();

    // Сайт the-internet обычно возвращает HTML с текстом "Congratulations!"
    expect(body).toContain('Congratulations!');
  });

  test('should return 401 with invalid password', async ({ request }) => {
    // Корректный username, но неправильный password.
    // Это негативный сценарий.
    const response = await request.get(endpoint, {
      headers: {
        Authorization: toBasicAuth('admin', 'wrong-password'),
      },
    });

    // Ожидаем 401.
    expect(response.status()).toBe(401);

    // Сервер должен снова прислать challenge header.
    // Это говорит о том, что доступ не выдан и требуется корректная аутентификация.
    expect(response.headers()['www-authenticate']).toBe('Basic realm="Restricted Area"');
  });

  test('should return 401 with invalid username', async ({ request }) => {
    // Неправильный username, правильный password.
    const response = await request.get(endpoint, {
      headers: {
        Authorization: toBasicAuth('wrong-user', 'admin'),
      },
    });

    // Ожидаем отказ в доступе.
    expect(response.status()).toBe(401);
  });

  test('should return 401 with malformed Authorization scheme', async ({ request }) => {
    // Проверяем случай, когда схема авторизации не Basic.
    // Даже если credentials формально похожи, сервер не должен принять такой запрос.
    const response = await request.get(endpoint, {
      headers: {
        Authorization: 'Bearer some-token',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should simulate challenge flow: first request 401, second request 200', async ({ request }) => {
    // Это приближённая симуляция того,
    // что делает браузер при Basic Auth.
    //
    // Шаг 1: первый запрос без auth -> 401
    const firstResponse = await request.get(endpoint);
    expect(firstResponse.status()).toBe(401);

    // Шаг 2: повторный запрос с credentials -> 200
    const secondResponse = await request.get(endpoint, {
      headers: {
        Authorization: toBasicAuth('admin', 'admin'),
      },
    });

    expect(secondResponse.status()).toBe(200);
  });
});