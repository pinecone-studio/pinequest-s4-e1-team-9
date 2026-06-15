describe('profile API helpers', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_PROFILE_API_URL = 'http://localhost:4000';
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

  it('appends the profile path when the env value is only an API origin', async () => {
    jest.doMock('@/features/auth/supabase', () => ({
      getAuthHeaders: async () => ({ Authorization: 'Bearer token' }),
    }));

    const { getCurrentProfile } = await import('./api');
    await expect(getCurrentProfile()).resolves.toMatchObject({
      name: 'Orgil',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/me/profile',
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      }),
    );
  });
});
