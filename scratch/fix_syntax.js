const fs = require('fs');

const files = process.argv.slice(2);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('export default async function') && content.includes('"use cache"')) {
    // Check if "use cache" is inside the parameters
    const badRegex = /export default async function\s+\w+\s*\(\{\s*"use cache";\s*cacheLife\("hours"\);\s*setUseStaticClient\(true\);\s*/;
    if (badRegex.test(content)) {
      // Remove it from the parameters
      content = content.replace(badRegex, match => match.replace(/\s*"use cache";\s*cacheLife\("hours"\);\s*setUseStaticClient\(true\);\s*/, '\n  '));
      
      // And add it after the closing parenthesis and brace
      content = content.replace(/(export default async function\s+\w+\s*\(\{[^)]*\}\s*:\s*\w+\s*\)\s*\{)/, `$1\n  "use cache";\n  cacheLife("hours");\n  setUseStaticClient(true);\n`);
      
      fs.writeFileSync(file, content);
      console.log('Fixed ' + file);
    }
  }
}
