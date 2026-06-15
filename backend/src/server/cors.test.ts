import { afterEach, describe, expect, it, jest } from '@jest/globals';

describe('CORS configuration', () => {
  const originalFrontendOrigin = process.env.FRONTEND_ORIGIN;

  afterEach(() => {
    if (originalFrontendOrigin === undefined) {
      delete process.env.FRONTEND_ORIGIN;
    } else {
      process.env.FRONTEND_ORIGIN = originalFrontendOrigin;
    }
    jest.resetModules();
  });

  it('allows the configured production frontend origin', async () => {
    process.env.FRONTEND_ORIGIN =
      'http://localhost:3000,https://frontend.example.com';
    const { createCorsHeaders, isAllowedCorsOrigin } = await import('./cors.js');

    expect(isAllowedCorsOrigin('https://frontend.example.com')).toBe(true);
    expect(createCorsHeaders('https://frontend.example.com')).toEqual(
      expect.objectContaining({
        'Access-Control-Allow-Origin': 'https://frontend.example.com',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      }),
    );
  });

  it('rejects unknown origins', async () => {
    process.env.FRONTEND_ORIGIN =
      'http://localhost:3000,https://frontend.example.com';
    const { isAllowedCorsOrigin } = await import('./cors.js');

    expect(isAllowedCorsOrigin('https://unknown.example.com')).toBe(false);
  });

  it('returns headers required for allowed OPTIONS preflight requests', async () => {
    process.env.FRONTEND_ORIGIN = 'https://frontend.example.com';
    const { createCorsHeaders, isAllowedCorsOrigin } = await import('./cors.js');
    const headers = createCorsHeaders('https://frontend.example.com');

    expect(isAllowedCorsOrigin('https://frontend.example.com')).toBe(true);
    expect(headers['Access-Control-Allow-Origin']).toBe(
      'https://frontend.example.com',
    );
    expect(headers['Access-Control-Allow-Methods']).toContain('OPTIONS');
    expect(headers['Access-Control-Allow-Headers']).toBe(
      'Authorization, Content-Type',
    );
  });
});
