import { DocumentProcessingError } from '../features/documents/types.js';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const windowMs = 60_000;
const buckets = new Map<string, RateLimitBucket>();

export function enforceRateLimit(input: {
  key: string;
  limit: number;
  label: string;
}) {
  const now = Date.now();
  const bucket = buckets.get(input.key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(input.key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  bucket.count += 1;

  if (bucket.count > input.limit) {
    throw new DocumentProcessingError(
      `Too many ${input.label} requests. Please try again soon.`,
      429,
    );
  }
}
