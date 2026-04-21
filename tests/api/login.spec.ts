import { test, expect } from '@playwright/test';

const endpoint = '/login';

test.describe('Login API', () => {
  test.describe('Positive scenarios', () => {
    test('should return 200 and token with valid credentials', async ({ request }) => {
      const response = await request.post(endpoint, {
        data: {
          username: 'admin',
          password: 'admin123',
        },
      });

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');

      const body = await response.json();

      expect(body.message).toBeDefined();
      expect(body.message).toContain('Login');
      expect(body.token).toBe('fake-jwt-token');
    });
  });

  test.describe('Negative scenarios', () => {
    test('should return 401 with invalid password', async ({ request }) => {
      const response = await request.post(endpoint, {
        data: {
          username: 'admin',
          password: 'wrong-password',
        },
      });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error).toBe('Invalid credentials');
    });

    test('should return 401 with invalid username', async ({ request }) => {
      const response = await request.post(endpoint, {
        data: {
          username: 'wrong-user',
          password: 'admin123',
        },
      });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error).toBe('Invalid credentials');
    });

    test('should return 401 with both username and password invalid', async ({ request }) => {
      const response = await request.post(endpoint, {
        data: {
          username: 'wrong-user',
          password: 'wrong-password',
        },
      });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error).toBe('Invalid credentials');
    });
  });

  test.describe('Validation scenarios', () => {
    test('should return 400 when username is missing', async ({ request }) => {
      const response = await request.post(endpoint, {
        data: {
          password: 'admin123',
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.error).toBe('Username and password are required');
    });

    test('should return 400 when password is missing', async ({ request }) => {
      const response = await request.post(endpoint, {
        data: {
          username: 'admin',
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.error).toBe('Username and password are required');
    });

    test('should return 400 when request body is empty', async ({ request }) => {
      const response = await request.post(endpoint, {
        data: {},
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.error).toBe('Username and password are required');
    });

    test('should return 400 when username and password are empty strings', async ({ request }) => {
      const response = await request.post(endpoint, {
        data: {
          username: '',
          password: '',
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.error).toBe('Username and password are required');
    });
  });

  test.describe('Protocol / contract checks', () => {
    test('should return JSON response', async ({ request }) => {
      const response = await request.post(endpoint, {
        data: {
          username: 'admin',
          password: 'admin123',
        },
      });

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
    });

    test('should not allow GET /login', async ({ request }) => {
      const response = await request.get(endpoint);

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});