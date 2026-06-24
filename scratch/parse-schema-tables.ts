import * as fs from "fs";
import * as path from "path";

const filePath = path.join(process.cwd(), "database.types.ts");
const content = fs.readFileSync(filePath, "utf-8");

// Parse table names and check if they have meta_title
const tables: string[] = [];
const lines = content.split("\n");

let currentTable = "";
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Detect table name start, e.g. "categories: {" or "categories: {"
  const tableMatch = line.match(/^(\w+):\s*\{$/);
  if (tableMatch) {
    // Check if it's within the Public/Tables structure.
    // In database.types.ts, tables are under Public -> Tables
    currentTable = tableMatch[1];
  }
  
  if (currentTable && (line.includes("meta_title:") || line.includes("meta_title?:"))) {
    if (!tables.includes(currentTable) && currentTable !== "Row" && currentTable !== "Insert" && currentTable !== "Update") {
      tables.push(currentTable);
    }
  }
}

console.log("Tables with meta_title:", tables);
