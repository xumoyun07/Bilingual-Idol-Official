import fs from "fs";

interface AuditItem {
  file: string;
  count: number;
  examples: Array<{
    line: number;
    text: string;
    type: string;
  }>;
}

function run() {
  console.log("=== Summarizing Audit Results ===");

  if (!fs.existsSync("audit_results.json")) {
    console.error("audit_results.json not found!");
    return;
  }

  const data: AuditItem[] = JSON.parse(fs.readFileSync("audit_results.json", "utf-8"));
  
  // We want to group by file/component and count the number of lines/texts
  const summary: Record<string, { count: number; sources: Set<string> }> = {};

  data.forEach(item => {
    // Extract a clean component/file name
    const filename = item.file;
    if (!summary[filename]) {
      summary[filename] = { count: 0, sources: new Set() };
    }
    summary[filename].count += item.count;
    item.examples.forEach(ex => {
      summary[filename].sources.add(ex.type);
    });
  });

  console.log("| Компонент / Файл | Число строк | Источник |");
  console.log("| :--- | :--- | :--- |");
  
  Object.entries(summary)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([file, info]) => {
      const sourcesStr = Array.from(info.sources).join(", ");
      console.log(`| \`${file}\` | ${info.count} | ${sourcesStr} |`);
    });
}

run();
