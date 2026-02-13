import { describe, expect, it } from 'vitest';
import { loadConfigFromEnv } from '../src/config.js';

describe('loadConfigFromEnv', () => {
  it('loads defaults when optional env is missing', () => {
    const config = loadConfigFromEnv({
      JULES_API_KEY: 'test-key',
    });

    expect(config.apiKey).toBe('test-key');
    expect(config.baseUrl).toBe('https://jules.googleapis.com');
    expect(config.apiVersion).toBe('v1alpha');
    expect(config.timeoutMs).toBe(30_000);
    expect(config.defaultPollIntervalMs).toBe(5_000);
    expect(config.defaultMaxPollMs).toBe(600_000);
    expect(config.maxRetries).toBe(2);
  });

  it('throws when JULES_API_KEY is missing', () => {
    expect(() => loadConfigFromEnv({})).toThrow(/Missing JULES_API_KEY/);
  });

  it('throws for invalid numeric env vars', () => {
    expect(() =>
      loadConfigFromEnv({
        JULES_API_KEY: 'test-key',
        JULES_HTTP_TIMEOUT_MS: '-1',
      })
    ).toThrow(/Invalid JULES_HTTP_TIMEOUT_MS/);
  });
});

