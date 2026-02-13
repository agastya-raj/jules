import { describe, expect, it } from 'vitest';
import { buildCreateSessionRequest } from '../src/tools/julesCreateSession.js';

describe('buildCreateSessionRequest', () => {
  it('builds a request with deterministic defaults', () => {
    const request = buildCreateSessionRequest({
      sourceResourceName: 'sources/github/agastya-raj/gemini-cli-mcp',
      prompt: 'Review commit abc123',
      startingBranch: 'main',
    });

    expect(request).toEqual({
      sourceContext: {
        source: 'sources/github/agastya-raj/gemini-cli-mcp',
        githubRepoContext: {
          startingBranch: 'main',
        },
      },
      prompt: 'Review commit abc123',
      title: undefined,
      requirePlanApproval: false,
      automationMode: 'AUTO_CREATE_PR',
    });
  });

  it('throws for invalid source resource names', () => {
    expect(() =>
      buildCreateSessionRequest({
        sourceResourceName: 'github/agastya-raj/gemini-cli-mcp',
        prompt: 'Review commit abc123',
        startingBranch: 'main',
      })
    ).toThrow(/Invalid sourceResourceName/);
  });

  it('throws when startingBranch is missing', () => {
    expect(() =>
      buildCreateSessionRequest({
        sourceResourceName: 'sources/github/agastya-raj/gemini-cli-mcp',
        prompt: 'Review commit abc123',
      })
    ).toThrow(/Missing startingBranch/);
  });
});

