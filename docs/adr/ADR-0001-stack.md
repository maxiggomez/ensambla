# ADR-0001 · Stack tecnológico

**Estado:** Aceptado · **Fecha:** 2026-07-12

## Contexto

El MVP se construye con **agentes de IA** (Codex, OpenCode, Claude Code) contra
specs de OpenSpec, sin presupuesto de infraestructura, es **multi-tenant** y tiene
un dominio con invariantes reales (roll-up de OKRs, `Measurement` tipado, ciclo de
experimentos). El criterio dominante es "qué stack produce menos errores cuando lo
escribe un agente": mainstream, fuertemente tipado, opinionado y testeable.

## Decisión

Stack **TypeScript full-stack**:

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
  (consistente con el prototipo ya construido).
- **Backend:** capa de dominio en TypeScript dentro del mismo repo (ver ADR-0002).
- **ORM:** Prisma (mejor DX para agentes; migraciones y tipos generados).
- **Base de datos:** PostgreSQL gestionado (Neon o Supabase), con RLS (ver ADR-0003).
- **Auth:** Clerk (free tier, rápido) o Auth.js si se prefiere self-hosted.
- **Validación / contratos:** Zod (schemas compartidos front/back; base de `Measurement`).
- **Testing:** Vitest (dominio + integración) y Playwright (e2e). Ver ADR-0006.
- **Hosting:** Vercel + Postgres gestionado. Jobs (recordatorios de cadencia,
  digests): Vercel Cron + tabla de jobs, o Inngest (free tier).

## Consecuencias

- (+) Un solo lenguaje end-to-end → menos cambio de contexto para los agentes.
- (+) Tipos end-to-end → el compilador atrapa errores del agente antes de runtime.
- (+) Zod alinea validación, tipos y criterios de aceptación en un solo lugar.
- (+) Costo inicial ~$0 sobre free tiers; escala barato.
- (−) Next.js fullstack puede diluir las fronteras de dominio → mitigado por ADR-0002.

## Alternativas consideradas

- **Python + Django:** admin CRUD gratis y modelado maduro, pero dos lenguajes y
  sin tipado end-to-end para los agentes.
- **Supabase BaaS-first:** el MVP más rápido, pero cuesta sostener las invariantes
  de dominio en BaaS puro. Se adopta parcialmente: Supabase/Neon como Postgres+Auth
  gestionado, con la lógica de dominio en una capa real.
