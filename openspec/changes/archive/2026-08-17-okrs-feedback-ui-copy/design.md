## Context

The UI copy is inconsistent: some screens use Spanish headings and badges
("Objetivos que bajan a resultados medibles", "Objetivo huérfano", "KR en riesgo")
while a few labels mix grammar and languages ("Nuevo Objective", "Sin KeyResult").
The product convention is es-AR copy that keeps the ubiquitous terms as standalone
nouns ("Nuevo Key Result", "Proyectos sin OKR").

## Decision

- Harmonize the odd labels instead of re-labelling the whole product: the
  actionable canonical labels already covered by acceptance tests ("Nuevo Key
  Result") stay untouched; only the three copies that read as mistakes change.
- The okrs empty state "Todavía no tiene Key Results." is consistent with the
  standalone-noun convention and is left as-is (out of scope).
- No spec/requirement change: this is presentation copy inside existing UI.

## Non-goals

- Re-translating headings, badges or other sections already following the canon.
- Renaming "Nuevo Key Result" or any label asserted by other capability suites.
- Any change to domain, application, infrastructure or schema.

## Risks

- None material: three string literals and two test expectations. The updated
  labels are covered by the onboarding unit test and the feedback e2e flow.