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
      // Config en sintaxis v7; se omite la detección de sintaxis legacy.
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
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message:
            "Límite de arquitectura violado (ADR-0002 / DDD): cross-módulo solo vía application/; domain/ es puro (solo domain propio + shared measurement/ids/errors). Import inválido: {{ from.element.types.[0] }} → {{ to.element.types.[0] }}.",
          policies: [
            // DDD — domain/ es puro: solo su propio dominio y el kernel puro
            // (measurement, ids, errors). Nunca ORM, tenancy, otros módulos ni UI.
            {
              from: { element: { type: "module-layer", captured: { layer: "domain" } } },
              allow: [
                {
                  element: {
                    type: "module-layer",
                    captured: { module: "{{ from.element.captured.module }}", layer: "domain" },
                  },
                },
                {
                  element: {
                    type: "shared-lib",
                    captured: { lib: "(measurement|ids|errors)" },
                  },
                },
              ],
            },
            // application/ orquesta: su módulo completo, shared, y otros módulos
            // solo por su application/.
            {
              from: { element: { type: "module-layer", captured: { layer: "application" } } },
              allow: [
                {
                  element: {
                    type: "module-layer",
                    captured: { module: "{{ from.element.captured.module }}" },
                  },
                },
                {
                  element: {
                    type: "module-root",
                    captured: { module: "{{ from.element.captured.module }}" },
                  },
                },
                { element: { type: "module-layer", captured: { layer: "application" } } },
                { element: { type: "shared" } },
                { element: { type: "shared-lib" } },
                { element: { type: "lib" } },
              ],
            },
            // infrastructure/ implementa: su módulo, shared completo (incl. db),
            // y otros módulos solo por application/.
            {
              from: {
                element: { type: "module-layer", captured: { layer: "infrastructure" } },
              },
              allow: [
                {
                  element: {
                    type: "module-layer",
                    captured: { module: "{{ from.element.captured.module }}" },
                  },
                },
                {
                  element: {
                    type: "module-root",
                    captured: { module: "{{ from.element.captured.module }}" },
                  },
                },
                { element: { type: "module-layer", captured: { layer: "application" } } },
                { element: { type: "shared" } },
                { element: { type: "shared-lib" } },
                { element: { type: "lib" } },
              ],
            },
            // Archivos en la raíz del módulo (index, barrel).
            {
              from: { element: { type: "module-root" } },
              allow: [
                {
                  element: {
                    type: "module-layer",
                    captured: { module: "{{ from.element.captured.module }}" },
                  },
                },
                {
                  element: {
                    type: "module-root",
                    captured: { module: "{{ from.element.captured.module }}" },
                  },
                },
                { element: { type: "module-layer", captured: { layer: "application" } } },
                { element: { type: "shared" } },
                { element: { type: "shared-lib" } },
                { element: { type: "lib" } },
              ],
            },
            // Kernel puro: measurement/ids/errors solo se importan entre sí.
            {
              from: {
                element: { type: "shared-lib", captured: { lib: "(measurement|ids|errors)" } },
              },
              allow: [
                {
                  element: {
                    type: "shared-lib",
                    captured: { lib: "(measurement|ids|errors)" },
                  },
                },
              ],
            },
            // Resto de shared (db, tenancy, …): shared completo, nunca módulos.
            {
              from: [
                { element: { type: "shared" } },
                {
                  element: {
                    type: "shared-lib",
                    captured: { lib: "!(measurement|ids|errors)" },
                  },
                },
              ],
              allow: [
                { element: { type: "shared" } },
                { element: { type: "shared-lib" } },
                { element: { type: "lib" } },
              ],
            },
            // App y UI compartida: consumen módulos solo por application/.
            {
              from: [
                { element: { type: "app" } },
                { element: { type: "components" } },
                { element: { type: "lib" } },
              ],
              allow: [
                { element: { type: "module-layer", captured: { layer: "application" } } },
                { element: { type: "shared" } },
                { element: { type: "shared-lib" } },
                { element: { type: "lib" } },
                { element: { type: "components" } },
                { element: { type: "app" } },
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
