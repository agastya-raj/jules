import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { JulesApiClient } from '../julesApiClient.js';
import { summarizeSessionResult } from './normalizers.js';
import { runTool } from './response.js';

export function registerJulesGetSessionResultTool(
  server: McpServer,
  client: JulesApiClient
): void {
  server.tool(
    'jules_get_session_result',
    'Get a high-signal summary for a session, including PR URL if present.',
    {
      sessionResourceName: z.string().min(1),
      includeActivities: z.boolean().optional(),
      activitiesPageSize: z.number().int().min(1).max(100).optional(),
    },
    async (input) =>
      runTool(async () => {
        const session = await client.getSession(input.sessionResourceName);
        const includeActivities = input.includeActivities ?? true;
        const activitiesResponse = includeActivities
          ? await client.listActivities(input.sessionResourceName, {
              pageSize: input.activitiesPageSize ?? 50,
            })
          : { activities: [] };

        const summary = summarizeSessionResult(
          session,
          activitiesResponse.activities ?? []
        );

        return {
          summary,
          raw: {
            session,
            activities: activitiesResponse.activities ?? [],
          },
        };
      })
  );
}
