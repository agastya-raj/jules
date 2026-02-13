import { describe, expect, it, vi } from 'vitest';
import { JulesApiClient } from '../src/julesApiClient.js';
import type { JulesApiConfig } from '../src/types.js';

function makeConfig(overrides: Partial<JulesApiConfig> = {}): JulesApiConfig {
  return {
    apiKey: 'test-api-key',
    baseUrl: 'https://jules.googleapis.com',
    apiVersion: 'v1alpha',
    timeoutMs: 10_000,
    defaultPollIntervalMs: 1000,
    defaultMaxPollMs: 60_000,
    maxRetries: 2,
    ...overrides,
  };
}

describe('JulesApiClient', () => {
  it('calls listSources with expected query and auth header', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ sources: [{ name: 'sources/github/repo' }] }), {
        status: 200,
      })
    );

    const client = new JulesApiClient(makeConfig(), { fetchFn });
    await client.listSources({ pageSize: 10, pageToken: 'abc', filter: 'provider=github' });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/v1alpha/sources');
    expect(url).toContain('pageSize=10');
    expect(url).toContain('pageToken=abc');
    expect(url).toContain('filter=provider%3Dgithub');
    const headers = new Headers(init.headers as HeadersInit);
    expect(headers.get('X-Goog-Api-Key')).toBe('test-api-key');
  });

  it('retries once on HTTP 429 and succeeds', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: { message: 'rate limited' },
          }),
          { status: 429 }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ sources: [] }), { status: 200 })
      );
    const sleepFn = vi.fn().mockResolvedValue(undefined);

    const client = new JulesApiClient(makeConfig({ maxRetries: 1 }), {
      fetchFn,
      sleepFn,
    });

    const response = await client.listSources();
    expect(response.sources).toEqual([]);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(sleepFn).toHaveBeenCalledTimes(1);
  });

  it('maps 401 responses to AUTH_ERROR', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { message: 'invalid key' },
        }),
        { status: 401 }
      )
    );

    const client = new JulesApiClient(makeConfig({ maxRetries: 0 }), { fetchFn });

    await expect(client.getSession('sessions/abc')).rejects.toMatchObject({
      code: 'AUTH_ERROR',
      message: 'invalid key',
    });
  });

  it('encodes session resource paths', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ name: 'sessions/my session' }), { status: 200 })
    );
    const client = new JulesApiClient(makeConfig(), { fetchFn });

    await client.getSession('sessions/my session');
    const [url] = fetchFn.mock.calls[0] as [string];
    expect(url).toContain('/sessions/my%20session');
  });

  it('encodes source resource paths for getSource', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ name: 'sources/github/org/repo' }), {
        status: 200,
      })
    );
    const client = new JulesApiClient(makeConfig(), { fetchFn });

    await client.getSource('sources/github/org/repo');
    const [url] = fetchFn.mock.calls[0] as [string];
    expect(url).toContain('/sources/github/org/repo');
  });

  it('encodes activity resource paths for getActivity', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ name: 'sessions/1/activities/a-1' }), {
        status: 200,
      })
    );
    const client = new JulesApiClient(makeConfig(), { fetchFn });

    await client.getActivity('sessions/1/activities/a-1');
    const [url] = fetchFn.mock.calls[0] as [string];
    expect(url).toContain('/sessions/1/activities/a-1');
  });
});
