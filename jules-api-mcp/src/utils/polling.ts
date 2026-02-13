import type { JulesSession } from '../types.js';

export interface WaitForSessionStateOptions {
  getSession: () => Promise<JulesSession>;
  targetStates: string[];
  timeoutMs: number;
  pollIntervalMs: number;
}

export interface WaitForSessionStateResult {
  timedOut: boolean;
  attempts: number;
  elapsedMs: number;
  state: string;
  session: JulesSession;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeState(state: unknown): string {
  return typeof state === 'string' ? state.toUpperCase() : 'UNKNOWN';
}

export async function waitForSessionState(
  options: WaitForSessionStateOptions
): Promise<WaitForSessionStateResult> {
  const startedAt = Date.now();
  const target = new Set(options.targetStates.map((state) => state.toUpperCase()));
  let attempts = 0;

  // The loop always performs at least one fetch for the current state.
  while (true) {
    attempts += 1;
    const session = await options.getSession();
    const state = normalizeState(session.state);
    const elapsedMs = Date.now() - startedAt;

    if (target.has(state)) {
      return {
        timedOut: false,
        attempts,
        elapsedMs,
        state,
        session,
      };
    }

    if (elapsedMs >= options.timeoutMs) {
      return {
        timedOut: true,
        attempts,
        elapsedMs,
        state,
        session,
      };
    }

    await sleep(options.pollIntervalMs);
  }
}

