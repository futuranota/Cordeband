import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { authorizeProcessorCallback } from '@/lib/processor-callback-auth';

const ORIGINAL = process.env.PROCESSOR_CALLBACK_TOKEN;

beforeEach(() => {
  process.env.PROCESSOR_CALLBACK_TOKEN = 'secret-token-123';
});

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.PROCESSOR_CALLBACK_TOKEN;
  else process.env.PROCESSOR_CALLBACK_TOKEN = ORIGINAL;
});

function req(authorization?: string): Request {
  return new Request('http://localhost/x', {
    method: 'POST',
    headers: authorization ? { authorization } : undefined,
  });
}

describe('authorizeProcessorCallback', () => {
  it('accepts the matching bearer token', () => {
    expect(authorizeProcessorCallback(req('Bearer secret-token-123'))).toBe(true);
  });

  it('rejects a wrong token of the same length', () => {
    expect(authorizeProcessorCallback(req('Bearer secret-token-XYZ'))).toBe(false);
  });

  it('rejects a wrong token of different length', () => {
    expect(authorizeProcessorCallback(req('Bearer short'))).toBe(false);
  });

  it('rejects a missing Authorization header', () => {
    expect(authorizeProcessorCallback(req())).toBe(false);
  });

  it('rejects when the secret is unset', () => {
    delete process.env.PROCESSOR_CALLBACK_TOKEN;
    expect(authorizeProcessorCallback(req('Bearer secret-token-123'))).toBe(false);
  });

  it('rejects a non-bearer scheme', () => {
    expect(authorizeProcessorCallback(req('Basic secret-token-123'))).toBe(false);
  });
});
