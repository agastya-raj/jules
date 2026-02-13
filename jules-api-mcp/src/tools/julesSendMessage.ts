import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { JulesApiClient } from '../julesApiClient.js';
import { runTool } from './response.js';

export function registerJulesSendMessageTool(
  server: McpServer,
  client: JulesApiClient
): void {
  server.tool(
    'jules_send_message',
    'Send a follow-up prompt to an active Jules session.',
    {
      sessionResourceName: z.string().min(1),
      prompt: z.string().min(1),
    },
    async (input) =>
      runTool(async () => {
        const response = await client.sendMessage(input.sessionResourceName, {
          prompt: input.prompt,
        });
        return {
          ack: true,
          raw: response,
        };
      })
  );
}

