const REDACTED = '***REDACTED***';

function shouldRedactHeader(headerName: string): boolean {
  const normalized = headerName.toLowerCase();
  return (
    normalized.includes('authorization') ||
    normalized.includes('api-key') ||
    normalized.includes('token')
  );
}

export function redactApiKey(value: string): string {
  if (!value) {
    return REDACTED;
  }
  if (value.length <= 8) {
    return REDACTED;
  }
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function redactHeaders(
  headers: Record<string, string>
): Record<string, string> {
  const redacted: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    redacted[key] = shouldRedactHeader(key) ? REDACTED : value;
  }
  return redacted;
}

