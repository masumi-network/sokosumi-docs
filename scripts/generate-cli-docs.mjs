import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { fetchReadme, fetchAllImages, normalizeMarkdown } from './fetch-readme.mjs';

function addHeadlessAgentGuardrails(markdown) {
  let updated = markdown;

  const headlessIntro = 'The CLI supports a headless command path for autonomous agents and plugins.';
  const headlessGuardrail = `${headlessIntro} Agents should only use this command path: pass \`--json\`, avoid bare \`sokosumi\` because it launches the TUI, and avoid interactive auth or browser automation.`;
  if (!updated.includes(headlessGuardrail)) {
    updated = updated.replace(headlessIntro, headlessGuardrail);
  }

  updated = updated.replace(
    'Automated Better Auth CLI sign-in is not implemented in this repo yet. The likely future direction is first-party OAuth or device authorization for the CLI rather than trying to automate the browser Connections flow.',
    'Automated Better Auth CLI sign-in is not implemented in this repo yet. Autonomous agents should not try to automate the browser Connections flow; ask the user for an API key or use an existing token.'
  );

  updated = updated.replace(
    'Do not launch the Ink TUI from OpenAI/OpenHands-style agent runs unless a human explicitly asks for a local manual CLI check.',
    'Do not launch the Ink TUI from OpenAI/OpenHands-style agent runs. Use headless commands with `--json` only.'
  );

  return updated;
}

/**
 * Generate CLI documentation from sokosumi-cli README
 */
async function generateCliDocs() {
  try {
    console.log('🚀 Generating CLI documentation...');

    const sourceReadmeContent = process.env.SOKOSUMI_CLI_README_PATH
      ? readFileSync(process.env.SOKOSUMI_CLI_README_PATH, 'utf8')
      : await fetchReadme();
    const readmeContent = addHeadlessAgentGuardrails(sourceReadmeContent);
    const outputDir = './content/docs/cli_docs';

    mkdirSync(outputDir, { recursive: true });

    const baseUrl = 'https://raw.githubusercontent.com/masumi-network/sokosumi-cli/main';
    await fetchAllImages(readmeContent, baseUrl, outputDir);

    const mdxContent = `---
title: Sokosumi CLI
banner: /assets/sokosumi_banner_cli_tool.png
icon: FileTerminal
---

${readmeContent}
`;

    const outputPath = join(outputDir, 'index.mdx');
    writeFileSync(outputPath, normalizeMarkdown(mdxContent));

    console.log('✅ CLI documentation generated successfully!');
  } catch (error) {
    console.error('❌ Failed to generate CLI documentation:', error.message);
    process.exit(1);
  }
}

generateCliDocs();
