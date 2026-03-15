import { defineConfig } from "tsup";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["react", "react-dom"],
  onSuccess: async () => {
    // Copy SVG to dist
    mkdirSync("dist", { recursive: true });
    writeFileSync("dist/id.svg", readFileSync("assets/id.svg"));
  },
});
