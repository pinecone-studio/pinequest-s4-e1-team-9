function setNodeEnv(value: string | undefined) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value,
    configurable: true,
  });
}

describe('profile API helpers', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.resetModules();
    setNodeEnv('test');
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    delete process.env.NEXT_PUBLIC_PROFILE_API_URL;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        profile: {
          userId: 'user-1',
          name: 'Orgil',
          email: 'orgil@example.com',
          requiresNameCompletion: false,
          createdAt: '2026-06-15T00:00:00.000Z',
          updatedAt: '2026-06-15T00:00:00.000Z',
        },
      }),
    }) as jest.Mock;
  });

  afterEach(() => {
    setNodeEnv(originalNodeEnv);
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_PROFILE_API_URL;
  });

  it('builds the profile endpoint from the canonical API origin', async () => {
    jest.doMock('@/features/auth/supabase', () => ({
      getAuthHeaders: async () => ({ Authorization: 'Bearer token' }),
    }));

    const { getCurrentProfile } = await import('./api');
    await expect(getCurrentProfile()).resolves.toMatchObject({
      name: 'Orgil',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/api/me/profile',
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      }),
    );
  });

  it('sends an explicit Supabase access token in the Authorization header', async () => {
    jest.doMock('@/features/auth/supabase', () => ({
      getAuthHeaders: jest.fn(),
    }));

    const { updateCurrentProfile } = await import('./api');
    await updateCurrentProfile('Orgil', 'session-token');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/api/me/profile',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('does not request the profile when no authenticated session exists', async () => {
    jest.doMock('@/features/auth/supabase', () => ({
      getAuthHeaders: async () => {
        throw new Error('Please sign in before sending requests.');
      },
    }));

    const { getCurrentProfile } = await import('./api');
    await expect(getCurrentProfile()).rejects.toThrow(
      'Please sign in before sending requests.',
    );

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('turns network failures into a retryable production message', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    jest.doMock('@/features/auth/supabase', () => ({
      getAuthHeaders: async () => ({ Authorization: 'Bearer token' }),
    }));

    const { getCurrentProfile } = await import('./api');
    await expect(getCurrentProfile()).rejects.toThrow(
      'The application server could not be reached. Please retry shortly.',
    );
  });
});
