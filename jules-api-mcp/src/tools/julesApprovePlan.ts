import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { JulesApiClient } from '../julesApiClient.js';
import { runTool } from './response.js';

export function registerJulesApprovePlanTool(
  server: McpServer,
  client: JulesApiClient
): void {
  server.tool(
    'jules_approve_plan',
    'Approve a pending plan for a Jules session.',
    {
      sessionResourceName: z.string().min(1),
    },
    async (input) =>
      runTool(async () => {
        const response = await client.approvePlan(input.sessionResourceName);
        return {
          ack: true,
          raw: response,
        };
      })
  );
}

