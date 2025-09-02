import { generateFiles } from 'fumadocs-openapi';
import { writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Generate meta.json files for navigation structure
 */
function generateMetaFiles(outputDir) {
  const apiRefDir = outputDir;
  
  // Generate main meta.json
  const mainMeta = {
    title: "API Reference",
    icon: "Code2",
    root: true,
    pages: ["index", "agents", "jobs", "users"]
  };
  writeFileSync(join(apiRefDir, 'meta.json'), JSON.stringify(mainMeta, null, 2));

  // Generate meta.json for each subdirectory
  const subdirs = ['agents', 'jobs', 'users'];
  
  for (const subdir of subdirs) {
    const subdirPath = join(apiRefDir, subdir);
    try {
      const files = readdirSync(subdirPath)
        .filter(file => file.endsWith('.mdx'))
        .map(file => file.replace('.mdx', ''));
      
      const meta = {
        title: subdir.charAt(0).toUpperCase() + subdir.slice(1),
        pages: files
      };
      
      writeFileSync(join(subdirPath, 'meta.json'), JSON.stringify(meta, null, 2));
      console.log(`📋 Generated meta.json for ${subdir} (${files.length} pages)`);
    } catch (error) {
      console.warn(`⚠️  Could not generate meta.json for ${subdir}:`, error.message);
    }
  }
}

/**
 * Generate OpenAPI documentation files from Sokosumi API spec
 */
async function generateOpenAPI() {
  try {
    console.log('🚀 Generating Sokosumi API documentation...');
    console.log('📥 Fetching spec from: https://app.sokosumi.com/openapi.json');

    const outputDir = './content/docs/api-reference';

    await generateFiles({
      input: 'https://app.sokosumi.com/openapi.json',
      output: outputDir,
      per: 'operation',
      groupBy: 'tag',
    });

    console.log('📋 Generating navigation meta files...');
    generateMetaFiles(outputDir);

    console.log('✅ Sokosumi API documentation generated successfully!');
  } catch (error) {
    console.error('❌ Failed to generate API documentation:', error.message);
    process.exit(1);
  }
}

generateOpenAPI();