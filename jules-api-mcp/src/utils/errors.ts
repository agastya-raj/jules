export type JulesErrorCode =
  | 'AUTH_ERROR'
  | 'INVALID_ARGUMENT'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'UPSTREAM_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface ErrorPayload {
  code: JulesErrorCode;
  message: string;
  status?: number;
  requestId?: string;
  retryable?: boolean;
  hint?: string;
}

function isJsonObject(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null;
}

function extractMessageFromBody(body: unknown): string | undefined {
  if (!isJsonObject(body)) {
    return undefined;
  }

  const errorObject = isJsonObject(body.error) ? body.error : body;
  const maybeMessage = errorObject.message;
  return typeof maybeMessage === 'string' ? maybeMessage : undefined;
}

function mapStatusToCode(status: number): JulesErrorCode {
  if (status === 401 || status === 403) {
    return 'AUTH_ERROR';
  }
  if (status === 400) {
    return 'INVALID_ARGUMENT';
  }
  if (status === 404) {
    return 'NOT_FOUND';
  }
  if (status === 429) {
    return 'RATE_LIMITED';
  }
  if (status === 408 || status === 504) {
    return 'TIMEOUT';
  }
  if (status >= 500) {
    return 'UPSTREAM_ERROR';
  }
  return 'UNKNOWN_ERROR';
}

function hintForCode(code: JulesErrorCode): string | undefined {
  if (code === 'AUTH_ERROR') {
    return 'Verify JULES_API_KEY is valid and has access to Jules API.';
  }
  if (code === 'INVALID_ARGUMENT') {
    return 'Check source/session resource names and tool input fields. For jules_create_session, provide startingBranch and use automationMode=AUTO_CREATE_PR.';
  }
  if (code === 'RATE_LIMITED') {
    return 'Slow down requests or increase backoff between polling calls.';
  }
  return undefined;
}

export class JulesApiError extends Error {
  readonly code: JulesErrorCode;
  readonly status?: number;
  readonly requestId?: string;
  readonly retryable: boolean;
  readonly hint?: string;

  constructor(payload: ErrorPayload) {
    super(payload.message);
    this.name = 'JulesApiError';
    this.code = payload.code;
    this.status = payload.status;
    this.requestId = payload.requestId;
    this.retryable = Boolean(payload.retryable);
    this.hint = payload.hint;
  }

  static fromHttp(status: number, body: unknown, requestId?: string): JulesApiError {
    const code = mapStatusToCode(status);
    const message =
      extractMessageFromBody(body) ?? `Jules API request failed with HTTP ${status}.`;

    return new JulesApiError({
      code,
      message,
      status,
      requestId,
      retryable: status === 429 || status >= 500,
      hint: hintForCode(code),
    });
  }

  static fromNetwork(error: unknown): JulesApiError {
    if (error instanceof JulesApiError) {
      return error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      return new JulesApiError({
        code: 'TIMEOUT',
        message: 'Jules API request timed out.',
        retryable: true,
      });
    }

    if (error instanceof Error) {
      return new JulesApiError({
        code: 'NETWORK_ERROR',
        message: error.message,
        retryable: true,
      });
    }

    return new JulesApiError({
      code: 'UNKNOWN_ERROR',
      message: 'Unexpected error while calling Jules API.',
    });
  }
}

export function toErrorPayload(error: unknown): ErrorPayload {
  if (error instanceof JulesApiError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
      requestId: error.requestId,
      retryable: error.retryable,
      hint: error.hint,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'Unexpected non-error thrown.',
  };
}
