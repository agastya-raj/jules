import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { JulesApiClient } from '../julesApiClient.js';
import { normalizeSource } from './normalizers.js';
import { runTool } from './response.js';

export function registerJulesGetSourceTool(
  server: McpServer,
  client: JulesApiClient
): void {
  server.tool(
    'jules_get_source',
    'Get a single Jules source by resource name.',
    {
      sourceResourceName: z.string().min(1),
    },
    async (input) =>
      runTool(async () => {
        const response = (await client.getSource(input.sourceResourceName)) as Record<
          string,
          unknown
        >;
        return {
          source: normalizeSource(response),
          raw: response,
        };
      })
  );
}

