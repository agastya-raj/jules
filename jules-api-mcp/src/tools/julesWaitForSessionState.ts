import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { JulesApiClient } from '../julesApiClient.js';
import type { JulesApiConfig } from '../types.js';
import { waitForSessionState } from '../utils/polling.js';
import { normalizeSession } from './normalizers.js';
import { runTool } from './response.js';

export function registerJulesWaitForSessionStateTool(
  server: McpServer,
  client: JulesApiClient,
  config: JulesApiConfig
): void {
  server.tool(
    'jules_wait_for_session_state',
    'Poll a session until a target state is reached or timeout elapses.',
    {
      sessionResourceName: z.string().min(1),
      targetStates: z.array(z.string().min(1)).min(1).optional(),
      timeoutMs: z.number().int().min(500).max(7_200_000).optional(),
      pollIntervalMs: z.number().int().min(100).max(120_000).optional(),
    },
    async (input) =>
      runTool(async () => {
        const result = await waitForSessionState({
          getSession: () => client.getSession(input.sessionResourceName),
          targetStates: input.targetStates ?? ['COMPLETED', 'FAILED', 'CANCELLED'],
          timeoutMs: input.timeoutMs ?? config.defaultMaxPollMs,
          pollIntervalMs: input.pollIntervalMs ?? config.defaultPollIntervalMs,
        });

        return {
          timedOut: result.timedOut,
          attempts: result.attempts,
          elapsedMs: result.elapsedMs,
          state: result.state,
          session: normalizeSession(result.session),
          raw: result.session,
        };
      })
  );
}

