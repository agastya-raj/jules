#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfigFromEnv } from './config.js';
import { JulesApiClient } from './julesApiClient.js';
import { registerJulesApprovePlanTool } from './tools/julesApprovePlan.js';
import { registerJulesCreateSessionTool } from './tools/julesCreateSession.js';
import { registerJulesGetActivityTool } from './tools/julesGetActivity.js';
import { registerJulesGetSessionTool } from './tools/julesGetSession.js';
import { registerJulesGetSessionResultTool } from './tools/julesGetSessionResult.js';
import { registerJulesGetSourceTool } from './tools/julesGetSource.js';
import { registerJulesListActivitiesTool } from './tools/julesListActivities.js';
import { registerJulesListSessionsTool } from './tools/julesListSessions.js';
import { registerJulesListSourcesTool } from './tools/julesListSources.js';
import { registerJulesSendMessageTool } from './tools/julesSendMessage.js';
import { registerJulesWaitForSessionStateTool } from './tools/julesWaitForSessionState.js';

export function createServer(): McpServer {
  const config = loadConfigFromEnv();
  const client = new JulesApiClient(config);

  const server = new McpServer({
    name: 'jules-api-mcp',
    version: '0.1.0',
  });

  registerJulesListSourcesTool(server, client);
  registerJulesGetSourceTool(server, client);
  registerJulesListSessionsTool(server, client);
  registerJulesCreateSessionTool(server, client);
  registerJulesGetSessionTool(server, client);
  registerJulesListActivitiesTool(server, client);
  registerJulesGetActivityTool(server, client);
  registerJulesSendMessageTool(server, client);
  registerJulesApprovePlanTool(server, client);
  registerJulesWaitForSessionStateTool(server, client, config);
  registerJulesGetSessionResultTool(server, client);

  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.env.NODE_ENV !== 'test') {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to start jules-api-mcp: ${message}`);
    process.exit(1);
  });
}
