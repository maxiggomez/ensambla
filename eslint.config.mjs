import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Module boundaries (ADR-0002): modules talk only through `application/`.
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["src/**/*"],
      // Sintaxis de selectores v5 (estable y verificada); silencia avisos de migración.
      "boundaries/legacy-templates": true,
      "boundaries/legacy-warnings": false,
      "boundaries/elements": [
        {
          type: "module-layer",
          pattern: "src/modules/*/*",
          mode: "folder",
          capture: ["module", "layer"],
        },
        {
          type: "module-root",
          pattern: "src/modules/*",
          mode: "folder",
          capture: ["module"],
        },
        { type: "shared", pattern: "src/shared", mode: "folder" },
        { type: "app", pattern: "src/app", mode: "folder" },
        { type: "lib", pattern: "src/lib", mode: "folder" },
        { type: "components", pattern: "src/components", mode: "folder" },
      ],
      "import/resolver": {
        typescript: { alwaysTryTypes: true },
      },
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          message:
            "Los módulos se importan solo por su capa application/ (ADR-0002). Import inválido: ${file.type} → ${dependency.type}.",
          rules: [
            // Dentro de un módulo: libre entre sus propias capas.
            {
              from: [["module-layer", { module: "${from.module}" }]],
              allow: [
                ["module-layer", { module: "${from.module}" }],
                ["module-root", { module: "${from.module}" }],
                "shared",
                "lib",
              ],
            },
            // Entre módulos: solo la interfaz pública (application/).
            {
              from: ["module-layer", "module-root"],
              allow: [["module-layer", { layer: "application" }]],
            },
            {
              from: ["module-root"],
              allow: [
                ["module-layer", { module: "${from.module}" }],
                ["module-root", { module: "${from.module}" }],
                "shared",
                "lib",
              ],
            },
            // Shared kernel: no depende de módulos ni de la app.
            { from: ["shared"], allow: ["shared", "lib"] },
            // App y UI compartida: consumen módulos solo por application/.
            {
              from: ["app", "components", "lib"],
              allow: [
                ["module-layer", { layer: "application" }],
                "shared",
                "lib",
                "components",
                "app",
              ],
            },
          ],
        },
      ],
    },
  },
  // Prettier: desactiva reglas de formato que colisionan.
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
