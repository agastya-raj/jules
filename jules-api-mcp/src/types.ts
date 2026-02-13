export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type AutomationMode =
  | 'AUTOMATION_MODE_UNSPECIFIED'
  | 'AUTO_CREATE_PR';

export interface JulesSource {
  name?: string;
  displayName?: string;
  [key: string]: unknown;
}

export interface PullRequestOutput {
  url?: string;
  [key: string]: unknown;
}

export interface SessionOutput {
  pullRequest?: PullRequestOutput;
  [key: string]: unknown;
}

export interface JulesSession {
  name?: string;
  title?: string;
  state?: string;
  createTime?: string;
  updateTime?: string;
  requirePlanApproval?: boolean;
  automationMode?: AutomationMode | string;
  outputs?: SessionOutput[];
  [key: string]: unknown;
}

export interface JulesActivity {
  name?: string;
  createTime?: string;
  updateTime?: string;
  [key: string]: unknown;
}

export interface SourceContextInput {
  source: string;
  githubRepoContext?: {
    startingBranch?: string;
  };
}

export interface CreateSessionRequest {
  sourceContext: SourceContextInput;
  prompt: string;
  title?: string;
  requirePlanApproval?: boolean;
  automationMode?: AutomationMode;
}

export interface SendMessageRequest {
  prompt: string;
}

export interface ListRequest {
  pageSize?: number;
  pageToken?: string;
}

export interface ListSourcesRequest extends ListRequest {
  filter?: string;
}

export interface JulesApiConfig {
  apiKey: string;
  baseUrl: string;
  apiVersion: string;
  timeoutMs: number;
  defaultPollIntervalMs: number;
  defaultMaxPollMs: number;
  maxRetries: number;
}

export type FetchLike = typeof fetch;

export interface ListSourcesResponse {
  sources?: JulesSource[];
  nextPageToken?: string;
  [key: string]: unknown;
}

export interface ListSessionsResponse {
  sessions?: JulesSession[];
  nextPageToken?: string;
  [key: string]: unknown;
}

export interface ListActivitiesResponse {
  activities?: JulesActivity[];
  nextPageToken?: string;
  [key: string]: unknown;
}
