import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { JulesApiClient } from '../julesApiClient.js';
import { normalizeSource } from './normalizers.js';
import { runTool } from './response.js';

export function registerJulesListSourcesTool(
  server: McpServer,
  client: JulesApiClient
): void {
  server.tool(
    'jules_list_sources',
    'List Jules API sources accessible to the API key.',
    {
      pageSize: z.number().int().min(1).max(100).optional(),
      pageToken: z.string().min(1).optional(),
      filter: z.string().min(1).optional(),
    },
    async (input) =>
      runTool(async () => {
        const response = await client.listSources(input);
        return {
          sources: (response.sources ?? []).map(normalizeSource),
          nextPageToken: response.nextPageToken,
          raw: response,
        };
      })
  );
}
