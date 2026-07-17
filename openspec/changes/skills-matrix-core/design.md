# Design: skills-matrix-core

## Contexto

Tercer módulo de negocio; replica los patrones establecidos (módulo DDD,
`withTenantForUser`, RLS en la migración, cross-módulo por `application/`).
Branch apilado sobre `feat/teams-staffing-core` (usa sus tablas y loads).

## Decisiones

### D1 — Skill y Competency

`skill` es catálogo por Organización (nombre único por org, case-insensitive
via citext? no: UNIQUE sobre nombre normalizado con trim — MVP). `competency`
es Member + Skill + Level entero 0–4, UNIQUE (member_id, skill_id); setear de
nuevo actualiza el nivel (upsert). Level 0 significa "sin competencia
registrada explícitamente" y es válido (permite marcar el 0 a propósito).

### D2 — SkillRequirement: la "necesidad"

`skill_requirement` = skill requerida por **un Project o un KeyResult**
(exactamente uno de los dos, CHECK en DB), UNIQUE por par. Los gaps se evalúan
sobre las skills requeridas por KeyResults de Objectives **publicados**
(lectura vía `okrs/application.listObjectives`); el staffing acepta la
necesidad de cualquiera de los dos.

### D3 — Match de staffing (orden lexicográfico, sin pesos mágicos)

Para una necesidad con N skills requeridas, cada Member candidato obtiene:

1. `skillLevel`: promedio de sus niveles en las skills requeridas (0 si no
   tiene ninguna). Solo se sugiere gente con promedio > 0.
2. `seniorityRank`: `Senior` 3 · `SemiSenior` 2 · `Junior` 1 · sin dato 0.
3. `availability`: `100 − load` (load de `teams-staffing`), mínimo 0.

Orden: `skillLevel` desc → `seniorityRank` desc → `availability` desc →
nombre asc (desempate estable). **"no margin"**: `load ≥ 100` — la persona se
sugiere igual, con el flag (la spec lo exige explícitamente). Sin pesos
numéricos combinados: el orden lexicográfico es explicable y testeable.

### D4 — Umbrales de gaps (aprobados en gate; constantes nombradas en domain)

- `COVERAGE_LEVEL = 3`: una persona "cubre" una skill con nivel ≥ 3.
- Gap de cobertura: skill requerida por ≥ 2 Objectives publicados distintos y
  cobertura < 2 personas.
- Bus factor: skill requerida (por ≥ 1 Objective publicado) con exactamente 1
  persona de cobertura.

Configurables en un slice futuro; hoy son constantes exportadas del dominio.

### D5 — Seniority en identity-org

Enum `Seniority` (`Junior` / `SemiSenior` / `Senior`), columna nullable en
`member` (ALTER aditivo; los miembros existentes quedan sin dato = rank 0).
`setMemberSeniority` es caso de uso de `identity-org` (solo Dirección, mismo
patrón que `changeMemberRole`). `skills-matrix` lo lee del actor/candidatos
vía los datos de Member que ya expone la interfaz pública (`listMembers`).

### D6 — RLS 🔒 y permisos

`skill`, `competency`, `skill_requirement` con ENABLE + FORCE + política
tenant `FOR ALL` en la misma migración (patrón `member_tenant_all`).
Permisos MVP: definir skills, setear competencias y requirements → Dirección o
Líder; matriz, sugerencias y gaps → cualquier miembro. La matriz filtrada por
Team usa las asignaciones de `teams-staffing` (interfaz pública; se agrega un
export de lectura chico si falta).

## Nota de sync (cierre)

Como siempre: specs principales seeded; sync manual preservando lo fuera del
slice. El delta de `identity-org` agrega el requirement de seniority.

## Riesgos

- 🔒 Tenancy: tests de aislamiento para las tres tablas nuevas.
- Cross-módulo triple (identity-org, teams-staffing, okrs): solo por
  `application/`; el lint lo refuerza.
- ALTER de `member`: aditivo y nullable, sin backfill necesario.
