import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = process.cwd(),
  here = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({
  root: here,
  envDir: path.join(here, "no-env"),
  cacheDir: path.join(root, ".local/financial-spaces/ui-harness/cache"),
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: [
      { find: "@", replacement: root },
      { find: "next/navigation", replacement: path.join(here, "router.jsx") },
      { find: "next/link", replacement: path.join(here, "router.jsx") },
      {
        find: path.join(root, "lib/actions/spaces"),
        replacement: path.join(here, "services.js"),
      },
    ],
  },
  plugins: [
    {
      name: "fake-space-action",
      enforce: "pre",
      resolveId(id) {
        if (
          id === "@/lib/actions/invitations" ||
          id === path.join(root, "lib/actions/invitations") ||
          id === "@/lib/actions/spaces" ||
          id === path.join(root, "lib/actions/spaces")
        )
          return path.join(here, "services.js");
      },
    },
  ],
  server: {
    host: "127.0.0.1",
    port: 0,
    strictPort: true,
    fs: { allow: [root] },
  },
});
