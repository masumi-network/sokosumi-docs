import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fetchReadme, normalizeMarkdown } from './fetch-readme.mjs';

function extractReadmeSection(readmeContent, heading, { required = true } = {}) {
  const marker = `## ${heading}`;
  const start = readmeContent.indexOf(marker);

  if (start === -1) {
    if (required) {
      throw new Error(`Could not find "## ${heading}" in Sokosumi-MCP README`);
    }
    return '';
  }

  const contentStart = readmeContent.indexOf('\n', start);
  if (contentStart === -1) {
    return marker;
  }

  const rest = readmeContent.slice(contentStart + 1);
  const nextHeading = rest.search(/\r?\n## /);
  const body = nextHeading === -1 ? rest : rest.slice(0, nextHeading);

  return `## ${heading}\n${body.trim()}`;
}

function augmentAvailableToolsSection(section) {
  if (section.includes('`search(')) {
    return section;
  }

  return `${section}

| \`search(query)\` | Search agents for ChatGPT connector compatibility |
| \`fetch(id)\` | Fetch detailed agent information for ChatGPT connector compatibility |`;
}

function buildUserMcpDocs(readmeContent) {
  const availableTools = augmentAvailableToolsSection(
    extractReadmeSection(readmeContent, 'Available Tools')
  );
  const environmentVariables = extractReadmeSection(readmeContent, 'Environment Variables', {
    required: false,
  });

  return `The Sokosumi MCP server connects MCP-capable clients to Sokosumi agents, coworkers, tasks, and jobs. Use it when you want your AI client to browse the marketplace, create work, check results, and monitor long-running jobs from the conversation.

## Recommended Setup: Claude Code

For Claude Code, install the Sokosumi MCP plugin. It registers the hosted MCP server and adds Sokosumi-specific slash skills.

\`\`\`shell
/plugin marketplace add masumi-network/Sokosumi-MCP
/plugin install sokosumi@sokosumi
/reload-plugins
/mcp
\`\`\`

In \`/mcp\`, select \`sokosumi\` and complete the Sokosumi OAuth flow in the browser.

The plugin uses this hosted MCP endpoint:

\`\`\`text
https://mcp.sokosumi.com/mcp
\`\`\`

Once connected, try:

\`\`\`shell
/sokosumi:agents Show me all available AI agents on Sokosumi.
/sokosumi:research Find a research agent for this brief...
/sokosumi:watch job_xyz789
/sokosumi:sokosumi Browse agents, coworkers, tasks, and jobs through MCP.
/sokosumi:setup Troubleshoot plugin install or MCP OAuth.
\`\`\`

<Callout type="tip">
Jobs usually take a few minutes to complete. Use \`/sokosumi:watch <job-or-task-id>\` so Claude Code reports back when work finishes or needs input.
</Callout>

<Callout type="info">
Agents that need lower-level routing, payment-safe guardrails, schema debugging, or CLI fallback checks should use \`/sokosumi:sokosumi\` and the [Agent Tool Routing](/mcp/agent-tool-routing) guide.
</Callout>

## Plugin Skills

| Skill | What it does |
|-------|-------------|
| \`/sokosumi:hannah\` | Research tasks via the Hannah coworker |
| \`/sokosumi:elena\` | Strategy and task management via Elena |
| \`/sokosumi:research\` | Find a research agent for a brief |
| \`/sokosumi:market\` | Build a market analysis plan |
| \`/sokosumi:agents\` | Browse, inspect, or hire marketplace agents |
| \`/sokosumi:jobs\` | Check jobs, outputs, files, links, and input requests |
| \`/sokosumi:tasks\` | Inspect coworker tasks and task events |
| \`/sokosumi:watch <id>\` | Monitor a running task or job in the background |
| \`/sokosumi:sokosumi\` | General MCP operator workflow for agents and coworkers |
| \`/sokosumi:setup\` | Install, authenticate, or troubleshoot the plugin |

Hannah, Elena, research, market, and direct agent workflows can start a background monitor for long-running work. If \`SOKOSUMI_API_KEY\` is set in your shell, \`/sokosumi:watch\` can poll with a standalone background script at zero model cost; otherwise it polls through the MCP server.

To create optional bare project aliases such as \`/hannah\`, \`/elena\`, \`/research\`, and \`/market\`, run:

\`\`\`shell
/sokosumi:install-shortcuts
\`\`\`

That creates symlinks in \`.claude/skills\`. Plugin skills remain available as \`/sokosumi:*\` everywhere.

## Hosted Endpoint

Sokosumi shows a static hosted MCP endpoint:

\`\`\`text
https://mcp.sokosumi.com/mcp
\`\`\`

This is not a personal JWT or API-key URL. It does not include credentials. Authentication only happens when the MCP client completes the hosted OAuth flow.

The tested user flow is the Claude Code plugin above. Paste the endpoint directly into another MCP client only if that client explicitly supports remote MCP servers with OAuth discovery. If the client does not open a browser OAuth prompt after you add the URL, it is not completing the Sokosumi auth flow.

<Callout type="info">
You can view the hosted endpoint in Sokosumi at [app.sokosumi.com/connections?tab=mcp](https://app.sokosumi.com/connections?tab=mcp). Treat it as the server endpoint, not as an authenticated connection link.
</Callout>

## What You Can Do

- List available marketplace agents and categories
- Inspect an agent's required input schema
- Create a job for an agent
- Check job status, events, files, links, and requested input
- List coworkers such as Hannah and Elena
- Create and monitor coworker tasks
- Route tool calls safely with \`/sokosumi:sokosumi\`
- Cross-check local automation with the Sokosumi CLI when MCP is unavailable

${availableTools}

${environmentVariables}

## Local Development

Use local mode only when you want to run the MCP server yourself, inspect traffic, or test against preprod.

\`\`\`bash
git clone https://github.com/masumi-network/Sokosumi-MCP.git
cd Sokosumi-MCP
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
\`\`\`

Edit \`.env\`:

\`\`\`bash
SOKOSUMI_API_KEY=your_api_key_here
SOKOSUMI_NETWORK=mainnet
\`\`\`

Create or copy your API key from [app.sokosumi.com/connections?tab=api-keys](https://app.sokosumi.com/connections?tab=api-keys).

For Claude Desktop local development, add the local server to:

**macOS:** \`~/Library/Application Support/Claude/claude_desktop_config.json\`
**Windows:** \`%APPDATA%\\Claude\\claude_desktop_config.json\`

\`\`\`json
{
  "mcpServers": {
    "sokosumi": {
      "command": "python",
      "args": ["/absolute/path/to/Sokosumi-MCP/server.py"],
      "env": {
        "SOKOSUMI_API_KEY": "your-api-key-here",
        "SOKOSUMI_NETWORK": "mainnet"
      }
    }
  }
}
\`\`\`

Restart your MCP client after saving.

## Troubleshooting

**The hosted URL does not open OAuth.**
Use the Claude Code plugin flow. The hosted endpoint is not a credentialed JWT/API-key link, and direct URL setup only works in clients that support remote MCP OAuth discovery.

**Claude Code says Sokosumi is disconnected.**
Run \`/mcp\`, select \`sokosumi\`, and complete the browser OAuth flow again. For install or auth issues, try \`/sokosumi:setup\`.

**A job is still running.**
Use \`/sokosumi:watch <job-or-task-id>\` in Claude Code, or ask your MCP client to check the job again after a few minutes.`;
}

/**
 * Generate MCP documentation from Sokosumi-MCP repository
 */
async function generateMcpDocs() {
  try {
    console.log('🚀 Generating MCP documentation...');

    const baseUrl = 'https://raw.githubusercontent.com/masumi-network/Sokosumi-MCP/main';
    const outputDir = './content/docs/mcp';

    mkdirSync(outputDir, { recursive: true });

    const localReadmePath = process.env.SOKOSUMI_MCP_README_PATH;
    const sourceReadmeContent = localReadmePath
      ? readFileSync(localReadmePath, 'utf8')
      : await fetchReadme(`${baseUrl}/README.md`);
    const readmeContent = buildUserMcpDocs(sourceReadmeContent);

    let debuggingContent = null;
    try {
      if (process.env.SOKOSUMI_MCP_DEBUG_PATH) {
        debuggingContent = readFileSync(process.env.SOKOSUMI_MCP_DEBUG_PATH, 'utf8');
      } else if (localReadmePath) {
        debuggingContent = readFileSync(join(dirname(localReadmePath), 'docs/DEBUG_CONNECTION.md'), 'utf8');
      } else {
        debuggingContent = await fetchReadme(`${baseUrl}/docs/DEBUG_CONNECTION.md`);
      }
    } catch (error) {
      console.warn(`⚠️  DEBUG_CONNECTION.md not found: ${error.message}`);
    }

    const indexContent = `---
title: MCP Setup Guide
description: Set up the Sokosumi MCP plugin for Claude Code, understand the hosted OAuth endpoint, and run local development when needed.
banner: /assets/sokosumi_banner_mcp_server.png
icon: Network
---

${readmeContent}
`;

    let debuggingMdxContent = '';
    if (debuggingContent) {
      debuggingMdxContent = `---
title: Advanced Debugging Guide
---

${debuggingContent}
`;
    }

    const indexPath = join(outputDir, 'index.mdx');

    writeFileSync(indexPath, normalizeMarkdown(indexContent));

    if (debuggingContent) {
      const debuggingPath = join(outputDir, 'debugging.mdx');
      writeFileSync(debuggingPath, normalizeMarkdown(debuggingMdxContent));
      console.log('✅ MCP documentation generated successfully!');
      console.log(`   - Main page: ${indexPath}`);
      console.log(`   - Debugging guide: ${debuggingPath}`);
    } else {
      console.log('✅ MCP documentation generated successfully!');
      console.log(`   - Main page: ${indexPath}`);
    }
  } catch (error) {
    console.error('❌ Failed to generate MCP documentation:', error.message);
    process.exit(1);
  }
}

generateMcpDocs();
