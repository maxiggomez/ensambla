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
        {
          type: "shared-lib",
          pattern: "src/shared/*",
          mode: "folder",
          capture: ["lib"],
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
            "Límite de arquitectura violado (ADR-0002 / DDD): cross-módulo solo vía application/; domain/ es puro (solo domain propio + shared measurement/ids/errors). Import inválido: ${file.type} → ${dependency.type}.",
          rules: [
            // DDD — domain/ es puro: solo su propio dominio y el kernel puro
            // (measurement, ids, errors). Nunca ORM, tenancy, otros módulos ni UI.
            {
              from: [["module-layer", { layer: "domain" }]],
              allow: [
                ["module-layer", { module: "${from.module}", layer: "domain" }],
                ["shared-lib", { lib: "(measurement|ids|errors)" }],
              ],
            },
            // application/ orquesta: su módulo completo, shared, y otros módulos
            // solo por su application/.
            {
              from: [["module-layer", { layer: "application" }]],
              allow: [
                ["module-layer", { module: "${from.module}" }],
                ["module-root", { module: "${from.module}" }],
                ["module-layer", { layer: "application" }],
                "shared",
                "shared-lib",
                "lib",
              ],
            },
            // infrastructure/ implementa: su módulo, shared completo (incl. db),
            // y otros módulos solo por application/.
            {
              from: [["module-layer", { layer: "infrastructure" }]],
              allow: [
                ["module-layer", { module: "${from.module}" }],
                ["module-root", { module: "${from.module}" }],
                ["module-layer", { layer: "application" }],
                "shared",
                "shared-lib",
                "lib",
              ],
            },
            // Archivos en la raíz del módulo (index, barrel).
            {
              from: ["module-root"],
              allow: [
                ["module-layer", { module: "${from.module}" }],
                ["module-root", { module: "${from.module}" }],
                ["module-layer", { layer: "application" }],
                "shared",
                "shared-lib",
                "lib",
              ],
            },
            // Kernel puro: measurement/ids/errors solo se importan entre sí.
            {
              from: [["shared-lib", { lib: "(measurement|ids|errors)" }]],
              allow: [["shared-lib", { lib: "(measurement|ids|errors)" }]],
            },
            // Resto de shared (db, tenancy, …): shared completo, nunca módulos.
            {
              from: ["shared", ["shared-lib", { lib: "!(measurement|ids|errors)" }]],
              allow: ["shared", "shared-lib", "lib"],
            },
            // App y UI compartida: consumen módulos solo por application/.
            {
              from: ["app", "components", "lib"],
              allow: [
                ["module-layer", { layer: "application" }],
                "shared",
                "shared-lib",
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
