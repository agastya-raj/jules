# Jules MCP Server

This is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for [Jules](https://jules.google/). It allows you to delegate coding tasks to the Jules asynchronous agent from any MCP-compatible client.

## Prerequisites

To use this server with tools other than Gemini CLI, you must have the Jules CLI installed globally.

```bash
npm install -g @google/jules
```

## Build

To build the server from source:

```bash
cd mcp-server
npm install
npm run build
```

## Configuration

Replace `/absolute/path/to/...` with the actual path to your cloned repository.

### Claude Code / Claude Desktop

To use with Claude Code or Claude Desktop, add the server to your configuration.

**Command Line (Claude Code):**

```bash
claude mcp add jules -- node /absolute/path/to/jules-mcp-server/dist/jules.js
```

**Configuration File (`claude_mcp_config.json`):**

```json
{
  "mcpServers": {
    "jules": {
      "command": "node",
      "args": ["/absolute/path/to/jules-mcp-server/dist/jules.js"]
    }
  }
}
```

### OpenCode

Add the following to your OpenCode configuration file:

```json
"mcp": {
  "jules": {
    "type": "local",
    "command": ["node", "/absolute/path/to/jules-mcp-server/dist/jules.js"],
    "enabled": true
  }
}
```

### OpenAI Codex CLI

The Codex CLI supports standard MCP servers. You can configure it to launch this server using `node`.
