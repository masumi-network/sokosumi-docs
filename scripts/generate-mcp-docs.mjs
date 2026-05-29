import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fetchReadme, fetchAllImages } from './fetch-readme.mjs';

function normalizeMarkdown(markdown) {
  return `${markdown.replace(/[ \t]+$/gm, '').replace(/\n+$/g, '')}\n`;
}

function extractReadmeSection(readmeContent, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = readmeContent.match(
    new RegExp(`## ${escapedHeading}\\n[\\s\\S]*?(?=\\n## |$)`)
  );
  return match ? match[0].trim() : '';
}

function buildUserMcpDocs(readmeContent) {
  const availableTools = extractReadmeSection(readmeContent, 'Available Tools');

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
\`\`\`

<Callout type="tip">
Jobs usually take a few minutes to complete. Use \`/sokosumi:watch <job-or-task-id>\` so Claude Code reports back when work finishes or needs input.
</Callout>

## Hosted Endpoint

Sokosumi now shows a static hosted MCP endpoint:

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

${availableTools}

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
Run \`/mcp\`, select \`sokosumi\`, and complete the browser OAuth flow again.

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
    
    // Ensure directory exists
    mkdirSync(outputDir, { recursive: true });
    
    // Fetch README content
    const localReadmePath = process.env.SOKOSUMI_MCP_README_PATH;
    let readmeContent = localReadmePath
      ? readFileSync(localReadmePath, 'utf8')
      : await fetchReadme(`${baseUrl}/README.md`);
    readmeContent = buildUserMcpDocs(readmeContent);
    
    // Try to fetch advanced debugging guide from docs folder
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
    
    /* Fetch images from README
    await fetchAllImages(readmeContent, baseUrl, outputDir);
    
    // Update image paths in README content to point to images/ folder
    readmeContent = readmeContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      const filename = src.split('/').pop();
      return `![${alt}](./images/${filename})`;
    });
    */
    
    // Create index.mdx (main page)
    const indexContent = `---
title: MCP Setup Guide
description: Set up the Sokosumi MCP plugin for Claude Code, understand the hosted OAuth endpoint, and run local development when needed.
banner: /assets/sokosumi_banner_mcp_server.png
icon: Network
---

${readmeContent}
`;

    // Create debugging.mdx if debugging content exists
    let debuggingMdxContent = '';
    if (debuggingContent) {
      debuggingMdxContent = `---
title: Advanced Debugging Guide
---

${debuggingContent}
`;
    }

    // Write all files
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
