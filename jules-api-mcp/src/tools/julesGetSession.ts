import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { JulesApiClient } from '../julesApiClient.js';
import { normalizeSession } from './normalizers.js';
import { runTool } from './response.js';

export function registerJulesGetSessionTool(
  server: McpServer,
  client: JulesApiClient
): void {
  server.tool(
    'jules_get_session',
    'Fetch the latest state for a session resource.',
    {
      sessionResourceName: z.string().min(1),
    },
    async (input) =>
      runTool(async () => {
        const response = await client.getSession(input.sessionResourceName);
        return {
          session: normalizeSession(response),
          raw: response,
        };
      })
  );
}

