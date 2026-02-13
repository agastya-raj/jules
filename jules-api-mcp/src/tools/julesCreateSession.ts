import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { JulesApiClient } from '../julesApiClient.js';
import type { AutomationMode, CreateSessionRequest } from '../types.js';
import { normalizeSession } from './normalizers.js';
import { runTool } from './response.js';

const automationModeSchema = z.enum(['AUTOMATION_MODE_UNSPECIFIED', 'AUTO_CREATE_PR']);

function isValidSourceResourceName(sourceResourceName: string): boolean {
  return /^sources\/[^/]+\/[^/]+\/[^/]+$/.test(sourceResourceName);
}

export function buildCreateSessionRequest(input: {
  sourceResourceName: string;
  prompt: string;
  title?: string;
  startingBranch?: string;
  requirePlanApproval?: boolean;
  automationMode?: 'AUTOMATION_MODE_UNSPECIFIED' | 'AUTO_CREATE_PR';
}): CreateSessionRequest {
  if (!isValidSourceResourceName(input.sourceResourceName)) {
    throw new Error(
      `Invalid sourceResourceName "${input.sourceResourceName}". Expected format: sources/<provider>/<owner>/<repo>.`
    );
  }

  if (!input.startingBranch) {
    throw new Error(
      'Missing startingBranch. Provide the repository branch explicitly (for example, "main") when creating a Jules session.'
    );
  }

  const automationMode: AutomationMode = input.automationMode ?? 'AUTO_CREATE_PR';

  return {
    sourceContext: {
      source: input.sourceResourceName,
      githubRepoContext: {
        startingBranch: input.startingBranch,
      },
    },
    prompt: input.prompt,
    title: input.title,
    requirePlanApproval: input.requirePlanApproval ?? false,
    automationMode,
  };
}

export function registerJulesCreateSessionTool(
  server: McpServer,
  client: JulesApiClient
): void {
  server.tool(
    'jules_create_session',
    'Create a new Jules session for a given source and prompt.',
    {
      sourceResourceName: z.string().min(1),
      prompt: z.string().min(1),
      title: z.string().min(1).optional(),
      startingBranch: z.string().min(1).optional(),
      requirePlanApproval: z.boolean().optional(),
      automationMode: automationModeSchema.optional(),
    },
    async (input) =>
      runTool(async () => {
        const request = buildCreateSessionRequest(input);

        const response = await client.createSession(request);
        return {
          session: normalizeSession(response),
          raw: response,
        };
      })
  );
}
