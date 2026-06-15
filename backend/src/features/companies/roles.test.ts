import { describe, expect, it } from '@jest/globals';
import { isCompanyManager, toCompanyRoleLabel } from './roles.js';

describe('company role display helpers', () => {
  it('treats only owners as workspace managers', () => {
    expect(isCompanyManager('OWNER')).toBe(true);
    expect(isCompanyManager('ADMIN')).toBe(false);
    expect(toCompanyRoleLabel('OWNER')).toBe('Owner');
    expect(toCompanyRoleLabel('ADMIN')).toBe('Member');
  });

  it('treats members as members', () => {
    expect(isCompanyManager('MEMBER')).toBe(false);
    expect(toCompanyRoleLabel('MEMBER')).toBe('Member');
  });
});
