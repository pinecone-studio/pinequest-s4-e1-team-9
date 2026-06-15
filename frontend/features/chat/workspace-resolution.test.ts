import type { Company } from '@/features/companies/types';
import {
  isValidCompanyId,
  resolveChatWorkspace,
} from './workspace-resolution';

const validA = '123e4567-e89b-42d3-a456-426614174000';
const validB = '123e4567-e89b-42d3-a456-426614174001';
const validC = '123e4567-e89b-42d3-a456-426614174002';

function company(input: Partial<Company> & Pick<Company, 'id'>): Company {
  return {
    id: input.id,
    name: input.name ?? `AI ${input.id}`,
    domain: null,
    setupStatus: input.setupStatus ?? 'READY',
    archivedAt: input.archivedAt ?? null,
    lastActivityAt: input.lastActivityAt ?? null,
    createdAt: input.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: input.updatedAt ?? '2026-01-01T00:00:00.000Z',
    role: input.role ?? 'MEMBER',
  };
}

describe('chat workspace resolution', () => {
  it('returns no AI for a user with no memberships', () => {
    expect(resolveChatWorkspace([], null)).toEqual({
      status: 'none',
      shouldClearStaleSelection: false,
    });
  });

  it('uses the most recent accessible AI when last-selected AI is null', () => {
    const result = resolveChatWorkspace(
      [
        company({ id: validA, lastActivityAt: '2026-01-01T00:00:00.000Z' }),
        company({ id: validB, lastActivityAt: '2026-02-01T00:00:00.000Z' }),
      ],
      null,
    );

    expect(result).toMatchObject({
      status: 'selected',
      company: expect.objectContaining({ id: validB }),
      shouldPersist: true,
      shouldClearStaleSelection: false,
    });
  });

  it('treats a malformed saved AI id as stale and falls back', () => {
    expect(isValidCompanyId('not-an-ai')).toBe(false);

    const result = resolveChatWorkspace([company({ id: validA })], 'not-an-ai');

    expect(result).toMatchObject({
      status: 'selected',
      company: expect.objectContaining({ id: validA }),
      shouldPersist: true,
      shouldClearStaleSelection: true,
    });
  });

  it('falls back when the saved AI was deleted', () => {
    const result = resolveChatWorkspace([company({ id: validB })], validA);

    expect(result).toMatchObject({
      status: 'selected',
      company: expect.objectContaining({ id: validB }),
      shouldPersist: true,
      shouldClearStaleSelection: true,
    });
  });

  it('falls back when the saved AI is archived', () => {
    const result = resolveChatWorkspace(
      [
        company({ id: validA, setupStatus: 'ARCHIVED', archivedAt: '2026-01-01T00:00:00.000Z' }),
        company({ id: validB }),
      ],
      validA,
    );

    expect(result).toMatchObject({
      status: 'selected',
      company: expect.objectContaining({ id: validB }),
      shouldPersist: true,
      shouldClearStaleSelection: true,
    });
  });

  it('falls back when membership was removed', () => {
    const result = resolveChatWorkspace([company({ id: validB })], validA);

    expect(result).toMatchObject({
      status: 'selected',
      company: expect.objectContaining({ id: validB }),
      shouldPersist: true,
      shouldClearStaleSelection: true,
    });
  });

  it('uses a valid saved AI', () => {
    const result = resolveChatWorkspace(
      [
        company({ id: validA, lastActivityAt: '2026-01-01T00:00:00.000Z' }),
        company({ id: validB, lastActivityAt: '2026-02-01T00:00:00.000Z' }),
      ],
      validA,
    );

    expect(result).toMatchObject({
      status: 'selected',
      company: expect.objectContaining({ id: validA }),
      shouldPersist: false,
      shouldClearStaleSelection: false,
    });
  });

  it('replaces an invalid saved AI with another accessible fallback AI', () => {
    const result = resolveChatWorkspace(
      [
        company({ id: validB, lastActivityAt: '2026-02-01T00:00:00.000Z' }),
        company({ id: validC, lastActivityAt: '2026-03-01T00:00:00.000Z' }),
      ],
      validA,
    );

    expect(result).toMatchObject({
      status: 'selected',
      company: expect.objectContaining({ id: validC }),
      shouldPersist: true,
      shouldClearStaleSelection: true,
    });
  });
});
