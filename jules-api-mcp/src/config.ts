import type { JulesApiConfig } from './types.js';

const DEFAULT_BASE_URL = 'https://jules.googleapis.com';
const DEFAULT_API_VERSION = 'v1alpha';
const DEFAULT_HTTP_TIMEOUT_MS = 30_000;
const DEFAULT_POLL_INTERVAL_MS = 5_000;
const DEFAULT_MAX_POLL_MS = 600_000;
const DEFAULT_MAX_RETRIES = 2;

function parseNumber(
  key: string,
  value: string | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(
      `Invalid ${key} value "${value}". Expected a number between ${min} and ${max}.`
    );
  }
  return parsed;
}

export function loadConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env
): JulesApiConfig {
  const apiKey = env.JULES_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'Missing JULES_API_KEY. Create an API key in Jules and export it before launching this MCP server.'
    );
  }

  return {
    apiKey,
    baseUrl: (env.JULES_API_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, ''),
    apiVersion: (env.JULES_API_VERSION ?? DEFAULT_API_VERSION).replace(
      /^\/+|\/+$/g,
      ''
    ),
    timeoutMs: parseNumber(
      'JULES_HTTP_TIMEOUT_MS',
      env.JULES_HTTP_TIMEOUT_MS,
      DEFAULT_HTTP_TIMEOUT_MS,
      1_000,
      300_000
    ),
    defaultPollIntervalMs: parseNumber(
      'JULES_POLL_INTERVAL_MS',
      env.JULES_POLL_INTERVAL_MS,
      DEFAULT_POLL_INTERVAL_MS,
      100,
      120_000
    ),
    defaultMaxPollMs: parseNumber(
      'JULES_MAX_POLL_MS',
      env.JULES_MAX_POLL_MS,
      DEFAULT_MAX_POLL_MS,
      500,
      7_200_000
    ),
    maxRetries: parseNumber(
      'JULES_MAX_RETRIES',
      env.JULES_MAX_RETRIES,
      DEFAULT_MAX_RETRIES,
      0,
      10
    ),
  };
}

