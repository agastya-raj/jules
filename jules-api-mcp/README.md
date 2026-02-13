# Jules API MCP Server

`jules-api-mcp` is a standalone MCP server that talks directly to the Jules REST API.

It is designed to work with MCP clients like Codex and OpenCode without relying on the local `jules` CLI.

## Features

- Lists Jules sources and sessions
- Creates sessions (with configurable automation + plan approval)
- Gets session state and activities
- Sends follow-up prompts and approves plans
- Waits for terminal states with polling helper
- Summarizes a session result, including PR URL when available

## Requirements

- Node.js 20+
- Jules API key (`JULES_API_KEY`)

## Setup

```bash
cd jules-api-mcp
npm install
npm run build
```

Set environment variables (example):

```bash
export JULES_API_KEY="your-key"
export JULES_API_BASE_URL="https://jules.googleapis.com"
export JULES_API_VERSION="v1alpha"
```

## Running

```bash
npm run start
```

## Tool Surface

- `jules_list_sources`
- `jules_get_source`
- `jules_list_sessions`
- `jules_create_session`
- `jules_get_session`
- `jules_list_activities`
- `jules_get_activity`
- `jules_send_message`
- `jules_approve_plan`
- `jules_wait_for_session_state`
- `jules_get_session_result`

## Defaults

`jules_create_session` uses fast defaults unless you override:

- `requirePlanApproval`: `false`
- `automationMode`: `AUTO_CREATE_PR`
- `startingBranch`: required input (for example, `main`)

## Recommended Review Session Payload

Use this shape for commit-review requests:

```json
{
  "sourceResourceName": "sources/github/<owner>/<repo>",
  "startingBranch": "main",
  "automationMode": "AUTO_CREATE_PR",
  "prompt": "Review commit <sha> for bugs/regressions. Review-only, no code changes."
}
```

## Codex Integration

```bash
codex mcp add jules-api -- node /absolute/path/to/jules-api-mcp/dist/index.js
```

Verify:

```bash
codex mcp list
```

## OpenCode Integration

Add to your OpenCode config JSON:

```json
{
  "mcp": {
    "jules-api": {
      "type": "local",
      "enabled": true,
      "command": ["node", "/absolute/path/to/jules-api-mcp/dist/index.js"]
    }
  }
}
```

## Development

```bash
npm run lint
npm run typecheck
npm test
```

## Environment Variables

- `JULES_API_KEY` (required)
- `JULES_API_BASE_URL` (default: `https://jules.googleapis.com`)
- `JULES_API_VERSION` (default: `v1alpha`)
- `JULES_HTTP_TIMEOUT_MS` (default: `30000`)
- `JULES_POLL_INTERVAL_MS` (default: `5000`)
- `JULES_MAX_POLL_MS` (default: `600000`)
- `JULES_MAX_RETRIES` (default: `2`)

## Troubleshooting

- `INVALID_ARGUMENT` during `jules_create_session`:
  - Ensure `sourceResourceName` follows `sources/<provider>/<owner>/<repo>`
  - Provide `startingBranch` explicitly (for example, `main`)
  - Use `automationMode=AUTO_CREATE_PR`
