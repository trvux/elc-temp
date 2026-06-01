const fs = require('fs');

const files = process.argv.slice(2);

for (const file of files) {
  if (file.includes('gone/page.tsx') || file.includes('thank-you/page.tsx') || file === 'app/(public)/page.tsx') {
    continue;
  }
  
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('export default async function')) {
    continue;
  }

  if (content.includes('"use cache"')) {
    continue;
  }

  // Add imports if they don't exist
  if (!content.includes('setUseStaticClient')) {
    const imports = `import { setUseStaticClient } from "@/shared/lib/supabase/server";\nimport { cacheLife } from "next/cache";\n`;
    const importLines = content.split('\n').filter(l => l.startsWith('import '));
    if (importLines.length > 0) {
      const lastImport = importLines[importLines.length - 1];
      content = content.replace(lastImport, lastImport + '\n' + imports);
    } else {
      content = imports + content;
    }
  }

  // Match: export default async function Foo(...) {
  // Use regex that matches up to the closing parenthesis and then the opening brace
  content = content.replace(/(export default async function\s+\w+\s*\([^)]*\)\s*{(?:\s*\}|[^}]*\}|)[^\{]*\{\n|export default async function\s+\w+\s*\([^)]*\)\s*\{\n|export default async function[\s\S]*?\{\n)/, `$1  "use cache";\n  cacheLife("hours");\n  setUseStaticClient(true);\n\n`);

  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
}
