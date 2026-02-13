import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { JulesApiClient } from '../julesApiClient.js';
import { normalizeSession } from './normalizers.js';
import { runTool } from './response.js';

export function registerJulesListSessionsTool(
  server: McpServer,
  client: JulesApiClient
): void {
  server.tool(
    'jules_list_sessions',
    'List sessions visible to the current Jules API key.',
    {
      pageSize: z.number().int().min(1).max(100).optional(),
      pageToken: z.string().min(1).optional(),
    },
    async (input) =>
      runTool(async () => {
        const response = await client.listSessions(input);
        return {
          sessions: (response.sessions ?? []).map(normalizeSession),
          nextPageToken: response.nextPageToken,
          raw: response,
        };
      })
  );
}
