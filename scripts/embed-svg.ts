// Pre-build script: reads id.svg and writes it as an exported string constant
import { readFileSync, writeFileSync } from "fs";

const svg = readFileSync("assets/id.svg", "utf-8");
const escaped = JSON.stringify(svg);

writeFileSync(
  "src/svg-data.ts",
  `// Auto-generated — do not edit\nexport const SVG_CONTENT = ${escaped};\n`
);
