import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    // El scaffold arranca sin tests; se elimina al escribir el primero (fase 2).
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["test/integration/**/*.test.ts"],
          // Testcontainers levanta un Postgres efímero en Docker; darle margen.
          testTimeout: 60_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
