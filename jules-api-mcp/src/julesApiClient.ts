import type {
  CreateSessionRequest,
  FetchLike,
  JulesApiConfig,
  JulesSession,
  ListActivitiesResponse,
  ListRequest,
  ListSourcesRequest,
  ListSessionsResponse,
  ListSourcesResponse,
  SendMessageRequest,
} from './types.js';
import { JulesApiError } from './utils/errors.js';

interface ApiClientDependencies {
  fetchFn?: FetchLike;
  sleepFn?: (ms: number) => Promise<void>;
}

interface RequestOptions {
  method: 'GET' | 'POST';
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
}

function encodeResourcePath(resourceName: string): string {
  return resourceName
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function shouldRetryStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function backoffMs(attempt: number): number {
  // Capped exponential backoff with jitter.
  const base = Math.min(1000, 100 * 2 ** Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * 100);
  return base + jitter;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function getRequestId(response: Response): string | undefined {
  return (
    response.headers.get('x-request-id') ??
    response.headers.get('x-google-request-id') ??
    response.headers.get('x-cloud-trace-context') ??
    undefined
  );
}

export class JulesApiClient {
  private readonly config: JulesApiConfig;
  private readonly fetchFn: FetchLike;
  private readonly sleepFn: (ms: number) => Promise<void>;

  constructor(config: JulesApiConfig, dependencies: ApiClientDependencies = {}) {
    this.config = config;
    this.fetchFn = dependencies.fetchFn ?? fetch;
    this.sleepFn = dependencies.sleepFn ?? sleep;
  }

  async listSources(request: ListSourcesRequest = {}): Promise<ListSourcesResponse> {
    return this.request<ListSourcesResponse>({
      method: 'GET',
      path: '/sources',
      query: {
        pageSize: request.pageSize,
        pageToken: request.pageToken,
        filter: request.filter,
      },
    });
  }

  async getSource(sourceResourceName: string): Promise<unknown> {
    return this.request<unknown>({
      method: 'GET',
      path: `/${encodeResourcePath(sourceResourceName)}`,
    });
  }

  async listSessions(request: ListRequest = {}): Promise<ListSessionsResponse> {
    return this.request<ListSessionsResponse>({
      method: 'GET',
      path: '/sessions',
      query: {
        pageSize: request.pageSize,
        pageToken: request.pageToken,
      },
    });
  }

  async createSession(request: CreateSessionRequest): Promise<JulesSession> {
    return this.request<JulesSession>({
      method: 'POST',
      path: '/sessions',
      body: request,
    });
  }

  async getSession(sessionResourceName: string): Promise<JulesSession> {
    return this.request<JulesSession>({
      method: 'GET',
      path: `/${encodeResourcePath(sessionResourceName)}`,
    });
  }

  async listActivities(
    sessionResourceName: string,
    request: ListRequest = {}
  ): Promise<ListActivitiesResponse> {
    return this.request<ListActivitiesResponse>({
      method: 'GET',
      path: `/${encodeResourcePath(sessionResourceName)}/activities`,
      query: {
        pageSize: request.pageSize,
        pageToken: request.pageToken,
      },
    });
  }

  async getActivity(activityResourceName: string): Promise<unknown> {
    return this.request<unknown>({
      method: 'GET',
      path: `/${encodeResourcePath(activityResourceName)}`,
    });
  }

  async sendMessage(
    sessionResourceName: string,
    request: SendMessageRequest
  ): Promise<unknown> {
    return this.request<unknown>({
      method: 'POST',
      path: `/${encodeResourcePath(sessionResourceName)}:sendMessage`,
      body: request,
    });
  }

  async approvePlan(sessionResourceName: string): Promise<unknown> {
    return this.request<unknown>({
      method: 'POST',
      path: `/${encodeResourcePath(sessionResourceName)}:approvePlan`,
      body: {},
    });
  }

  private async request<T>(options: RequestOptions): Promise<T> {
    const maxAttempts = this.config.maxRetries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const version = this.config.apiVersion.replace(/^\/+|\/+$/g, '');
        const normalizedPath = options.path.startsWith('/')
          ? options.path
          : `/${options.path}`;
        const url = new URL(
          `${this.config.baseUrl}/${version}${normalizedPath}`
        );

        if (options.query) {
          for (const [key, value] of Object.entries(options.query)) {
            if (value !== undefined) {
              url.searchParams.set(key, String(value));
            }
          }
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
        let response: Response;
        try {
          response = await this.fetchFn(url.toString(), {
            method: options.method,
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': this.config.apiKey,
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        const responseBody = await parseBody(response);
        if (response.ok) {
          return responseBody as T;
        }

        const error = JulesApiError.fromHttp(
          response.status,
          responseBody,
          getRequestId(response)
        );

        if (attempt < maxAttempts && shouldRetryStatus(response.status)) {
          await this.sleepFn(backoffMs(attempt));
          continue;
        }

        throw error;
      } catch (error) {
        const mapped = JulesApiError.fromNetwork(error);
        if (attempt < maxAttempts && mapped.retryable) {
          await this.sleepFn(backoffMs(attempt));
          continue;
        }
        throw mapped;
      }
    }

    throw new JulesApiError({
      code: 'UNKNOWN_ERROR',
      message: 'Unexpected request loop termination.',
    });
  }
}
