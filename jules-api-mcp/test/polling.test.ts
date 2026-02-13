import { describe, expect, it } from 'vitest';
import { waitForSessionState } from '../src/utils/polling.js';

describe('waitForSessionState', () => {
  it('returns success once target state appears', async () => {
    let calls = 0;
    const result = await waitForSessionState({
      getSession: async () => {
        calls += 1;
        return {
          name: 'sessions/123',
          state: calls >= 2 ? 'COMPLETED' : 'RUNNING',
        };
      },
      targetStates: ['COMPLETED'],
      timeoutMs: 1000,
      pollIntervalMs: 1,
    });

    expect(result.timedOut).toBe(false);
    expect(result.state).toBe('COMPLETED');
    expect(result.attempts).toBeGreaterThanOrEqual(2);
  });

  it('times out when target state is never reached', async () => {
    const result = await waitForSessionState({
      getSession: async () => ({
        name: 'sessions/123',
        state: 'RUNNING',
      }),
      targetStates: ['COMPLETED'],
      timeoutMs: 25,
      pollIntervalMs: 5,
    });

    expect(result.timedOut).toBe(true);
    expect(result.state).toBe('RUNNING');
  });
});

