import { defineConfig } from "prisma/config";

// Prisma 7: la URL del datasource vive acá (solo la usan los comandos de CLI,
// p. ej. `prisma migrate`); la app y los tests conectan vía driver adapter.
// Condicional para que `prisma generate` funcione sin DATABASE_URL seteada.
export default defineConfig({
  schema: "prisma/schema.prisma",
  ...(process.env.DATABASE_URL ? { datasource: { url: process.env.DATABASE_URL } } : {}),
});
