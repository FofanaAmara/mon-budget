import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-*/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vercel output and local env
    ".vercel/**",
    // Design previews, private evidence and generated tooling are not app sources.
    "cs-design/**",
    ".tmp/**",
    ".local/**",
    ".Codex/**",
    // Migration scripts (CommonJS — intentionally use require)
    "scripts/**",
  ]),
]);

export default eslintConfig;
