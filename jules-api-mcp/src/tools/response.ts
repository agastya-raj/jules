import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { toErrorPayload } from '../utils/errors.js';

export function ok(data: unknown): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ ok: true, data }, null, 2),
      },
    ],
  };
}

export function fail(error: unknown): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ ok: false, error: toErrorPayload(error) }, null, 2),
      },
    ],
  };
}

export async function runTool<T>(fn: () => Promise<T>): Promise<CallToolResult> {
  try {
    return ok(await fn());
  } catch (error) {
    return fail(error);
  }
}

