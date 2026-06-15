import { buildApiResourceUrl, normalizeApiOrigin } from './env';

function setNodeEnv(value: string | undefined) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value,
    configurable: true,
  });
}

describe('frontend API environment helpers', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    setNodeEnv(originalNodeEnv);
  });

  it('normalizes a canonical production API origin', () => {
    expect(normalizeApiOrigin('https://api.example.com///')).toBe(
      'https://api.example.com',
    );
  });

  it('treats NEXT_PUBLIC_API_URL as an origin even if a path is provided', () => {
    expect(normalizeApiOrigin('https://api.example.com/api/me/profile')).toBe(
      'https://api.example.com',
    );
  });

  it('derives resource URLs from the canonical API origin', () => {
    expect(
      buildApiResourceUrl(
        'https://api.example.com',
        '/api/me/profile',
      ),
    ).toBe('https://api.example.com/api/me/profile');
  });

  it('keeps complete legacy endpoint overrides unchanged', () => {
    expect(
      buildApiResourceUrl(
        'https://api.example.com',
        '/api/me/profile',
        'https://legacy.example.com/api/me/profile',
        'NEXT_PUBLIC_PROFILE_API_URL',
      ),
    ).toBe('https://legacy.example.com/api/me/profile');
  });

  it('does not use localhost API values in production', () => {
    setNodeEnv('production');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(
      buildApiResourceUrl(
        'http://localhost:4000',
        '/api/me/profile',
      ),
    ).toBe('');

    warnSpy.mockRestore();
  });
});
