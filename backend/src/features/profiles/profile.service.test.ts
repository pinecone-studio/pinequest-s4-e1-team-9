import { beforeAll, describe, expect, it, jest } from '@jest/globals';

let normalizeProfileName: typeof import('./profile.service.js').normalizeProfileName;

describe('profile name validation', () => {
  beforeAll(async () => {
    jest.doMock('../../db/repositories/profiles.repo.js', () => ({
      getUserProfile: jest.fn(),
      upsertUserProfile: jest.fn(),
      updateUserProfile: jest.fn(),
    }));
    ({ normalizeProfileName } = await import('./profile.service.js'));
  });

  it('rejects whitespace-only names', () => {
    expect(() => normalizeProfileName('   \n\t  ')).toThrow(
      'Name must be at least 2 characters.',
    );
  });

  it('accepts Unicode and Mongolian names', () => {
    expect(normalizeProfileName('  Оргил Энх  ')).toBe('Оргил Энх');
  });

  it('enforces the maximum length', () => {
    expect(() => normalizeProfileName('a'.repeat(81))).toThrow(
      'Name must be 80 characters or fewer.',
    );
  });
});
