import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { JulesApiClient } from '../julesApiClient.js';
import { normalizeActivity } from './normalizers.js';
import { runTool } from './response.js';

export function registerJulesGetActivityTool(
  server: McpServer,
  client: JulesApiClient
): void {
  server.tool(
    'jules_get_activity',
    'Get a single activity by activity resource name.',
    {
      activityResourceName: z.string().min(1),
    },
    async (input) =>
      runTool(async () => {
        const response = (await client.getActivity(
          input.activityResourceName
        )) as Record<string, unknown>;
        return {
          activity: normalizeActivity(response),
          raw: response,
        };
      })
  );
}

