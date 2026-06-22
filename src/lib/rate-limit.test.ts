import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limit';

afterEach(() => {
  vi.useRealTimers();
});

describe('checkRateLimit', () => {
  it('allows calls within limit', () => {
    const key = `t1-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, { limit: 5, windowMs: 1000 }).ok).toBe(true);
    }
  });

  it('blocks once limit is exceeded and returns retryAfter', () => {
    const key = `t2-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, { limit: 3, windowMs: 1000 });
    }
    const blocked = checkRateLimit(key, { limit: 3, windowMs: 1000 });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it('resets after the window elapses', () => {
    vi.useFakeTimers();
    const key = `t3-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, { limit: 3, windowMs: 1000 });
    }
    expect(checkRateLimit(key, { limit: 3, windowMs: 1000 }).ok).toBe(false);
    vi.advanceTimersByTime(1500);
    expect(checkRateLimit(key, { limit: 3, windowMs: 1000 }).ok).toBe(true);
  });
});
