import { isValidConversationId } from './api';

describe('chat API helpers', () => {
  it('accepts UUID conversation ids for company-scoped history routes', () => {
    expect(isValidConversationId('123e4567-e89b-12d3-a456-426614174000')).toBe(
      true,
    );
  });

  it('rejects malformed conversation ids before route calls', () => {
    expect(isValidConversationId('not-a-conversation')).toBe(false);
    expect(isValidConversationId('../other-company')).toBe(false);
  });
});
