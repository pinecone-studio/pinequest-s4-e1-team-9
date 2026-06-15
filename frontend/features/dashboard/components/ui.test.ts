import {
  documentStatusLabel,
  documentStatusTone,
  statusLabel,
  statusTone,
  getUseCaseLabel,
} from './presentation';

describe('dashboard presentation helpers', () => {
  it('uses product-facing setup status labels and tones', () => {
    expect(statusLabel('NEEDS_ATTENTION')).toBe('Needs attention');
    expect(statusTone('READY')).toBe('success');
    expect(statusTone('DRAFT')).toBe('warning');
    expect(statusTone('FAILED')).toBe('error');
  });

  it('maps document states into clear upload language', () => {
    expect(documentStatusLabel('queued')).toBe('Queued');
    expect(documentStatusLabel('processing')).toBe('Processing');
    expect(documentStatusLabel('error')).toBe('Failed');
    expect(documentStatusTone('ready')).toBe('success');
  });

  it('uses concise use-case labels', () => {
    expect(getUseCaseLabel('company_team')).toBe('Company or Team');
    expect(getUseCaseLabel('personal_knowledge')).toBe('Personal Knowledge');
    expect(getUseCaseLabel(undefined)).toBe('Custom');
  });
});
