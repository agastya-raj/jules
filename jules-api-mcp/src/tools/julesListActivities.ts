import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { JulesApiClient } from '../julesApiClient.js';
import { normalizeActivity } from './normalizers.js';
import { runTool } from './response.js';

export function registerJulesListActivitiesTool(
  server: McpServer,
  client: JulesApiClient
): void {
  server.tool(
    'jules_list_activities',
    'List activity events for a Jules session.',
    {
      sessionResourceName: z.string().min(1),
      pageSize: z.number().int().min(1).max(100).optional(),
      pageToken: z.string().min(1).optional(),
    },
    async (input) =>
      runTool(async () => {
        const response = await client.listActivities(input.sessionResourceName, {
          pageSize: input.pageSize,
          pageToken: input.pageToken,
        });
        return {
          activities: (response.activities ?? []).map(normalizeActivity),
          nextPageToken: response.nextPageToken,
          raw: response,
        };
      })
  );
}
