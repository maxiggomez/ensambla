# Ensambla · Criterios de aceptación (MVP)

**Business Alignment & Agile People OS**
Versión para validación · formato WHEN/THEN por escenario (compatible con OpenSpec)

---

## Cómo leer este documento

- Cada capability agrupa **historias de usuario (HU)** con un ID (ej. `OKR-2`).
- Cada HU tiene sus **criterios de aceptación** en formato `WHEN … THEN …`.
- 🔒 marca invariantes de negocio críticas. ⏳ marca lo diferido a post-MVP.
- Roles: **Dirección**, **Líder** (de equipo), **Colaborador**.
- **Terminología:** usamos **Team** (equipo) como unidad organizativa —con nombre y descripción propios— en lugar de "squad".

### Leyenda de tipos de métrica (referenciada en varios lugares)

Una **métrica tipada** (`Measurement`) tiene un tipo elegido por el usuario: **Check** (boolean), **Porcentaje**, **Número entero**, **Moneda**, **Texto/Hito**. Reglas de progreso:

- Check → 0% o 100%.
- Porcentaje / Número / Moneda → `(actual − inicial) / (target − inicial)`.
- Texto/Hito → sin progreso numérico; se mide por estado (sin empezar / en curso / hecho).

🔒 **Regla de roll-up:** el avance de un objetivo se deriva del promedio ponderado de sus KRs; los KRs de tipo Texto/Hito y Check aportan 0% o 100% según su estado. El objetivo nunca se edita a mano.

Este mismo `Measurement` se reutiliza en OKRs, North Star y Experimentos.

---

## CAP-0 · Identidad, Organización y Accesos (kernel)

**ORG-1 — Crear organización (tenant)**

- WHEN se crea una organización, THEN queda aislada: ningún dato es visible desde otra organización. 🔒
- WHEN el primer usuario crea la organización, THEN queda con rol Dirección (admin).

**ORG-2 — Invitar y gestionar miembros**

- WHEN invito a una persona por email, THEN recibe acceso solo a su organización con el rol asignado.
- WHEN una persona ya existe en la organización, THEN no se duplica (se fusiona por email). 🔒

**ORG-3 — Permisos por rol**

- WHEN un Colaborador entra, THEN ve su información y la pública de la organización, pero no edita OKRs de compañía.
- WHEN un Líder entra, THEN puede editar los OKRs, proyectos y personas de su team, no de otros.
- WHEN Dirección entra, THEN ve y edita todo dentro de su organización.

---

## CAP-SETUP · Onboarding y configuración inicial

**SET-1 — Setup guiado**

- WHEN una organización nueva entra por primera vez, THEN se ofrece el flujo de configuración en pasos.
- WHEN el usuario elige "Saltar configuración", THEN accede a la app con estructura vacía y puede configurar después.
- WHEN el usuario completa un paso, THEN puede volver atrás sin perder lo cargado.

**SET-2 — Partir de un template**

- WHEN el usuario indica tipo e industria, THEN se recomienda al menos un template acorde.
- WHEN elige un template, THEN se pre-cargan teams, North Star de ejemplo, OKRs modelo y taxonomía de skills.
- WHEN confirma, THEN todo lo generado queda **editable** (nada es definitivo). 🔒

**SET-3 — Importar planilla (CSV/XLSX)**

- WHEN sube un archivo, THEN el sistema detecta columnas y propone un mapeo automático a los campos de Ensambla.
- WHEN una columna queda sin mapear y es un campo requerido (Nombre, Email), THEN no permite continuar hasta resolverlo. 🔒
- WHEN el usuario cambia el destino de una columna a "Ignorar", THEN esa columna no se importa.
- WHEN se muestra la vista previa, THEN refleja las primeras filas tal como quedarán importadas.

**SET-4 — Validación de importación**

- WHEN hay filas con email faltante, THEN se listan aparte y no se importan hasta corregirlas.
- WHEN hay duplicados por email, THEN se fusionan en un solo registro. 🔒
- WHEN el usuario confirma, THEN se importan solo las filas válidas y se informa el total.
- WHEN termina la importación, THEN se puede re-importar para actualizar sin crear duplicados.

⏳ Importación de OKRs y de matriz de skills existente: mismo patrón de mapeo, post-MVP.

---

## CAP-S0 · Norte estratégico (Strategy)

**STR-1 — Definir visión, misión y valores**

- WHEN Dirección carga visión, misión y valores, THEN quedan visibles para toda la organización.
- WHEN se editan, THEN se conserva historial de cambios. ⏳

**STR-2 — Definir la North Star**

- WHEN se define la North Star, THEN es una métrica tipada (`Measurement`) con valor actual y target.
- WHEN se agregan métricas de input (palancas), THEN cada una puede vincularse a un objetivo. 🔒
- WHEN un objetivo se vincula como palanca, THEN aparece en el mapa estratégico bajo la North Star.

**STR-3 — Pilares estratégicos y cascada**

- WHEN se crea un pilar, THEN puede agrupar uno o más objetivos.
- WHEN abro el mapa estratégico, THEN veo la cascada Visión → North Star → Pilares → OKRs con el avance real de cada objetivo.

---

## CAP-S1 · OKRs (Alignment)

**OKR-1 — Crear un objetivo**

- WHEN creo un objetivo, THEN debo asignarle un nivel (compañía / área / equipo / persona) y un owner.
- WHEN intento publicar un objetivo sin al menos un key result, THEN se rechaza. 🔒
- WHEN publico el objetivo, THEN queda visible según permisos de rol.

**OKR-2 — Key results tipados**

- WHEN creo un key result, THEN elijo su tipo (Check / Porcentaje / Número / Moneda / Texto).
- WHEN el tipo es numérico (%, número, moneda), THEN son obligatorios valor inicial y target. 🔒
- WHEN el tipo es Texto/Hito, THEN no se exige target numérico.
- WHEN un key result no cumple los requisitos de su tipo, THEN se marca inválido y no permite publicar.

**OKR-3 — Check-in de key results**

- WHEN el Líder configura la cadencia de check-in (semanal / quincenal / mensual) de un objetivo o equipo, THEN esa cadencia rige los recordatorios y el cálculo de "desactualizado" (no se fuerza semanal). 🔒
- WHEN cargo un valor de check-in, THEN debe corresponder al tipo del KR o se rechaza con error de validación. 🔒
- WHEN actualizo un KR numérico, THEN su avance y el del objetivo padre se recalculan automáticamente.
- WHEN marco un KR de tipo Check como hecho, THEN su avance es 100% y el objetivo se recalcula.
- WHEN cargo un check-in, THEN puedo adjuntar un comentario y/o una evidencia del avance (link o archivo).
- WHEN mi confianza es menor a 5/10, THEN el KR se marca "en riesgo" y aparece en el dashboard de Dirección.
- WHEN pasa el período de la cadencia configurada sin check-in, THEN el KR se marca "desactualizado".

**OKR-4 — Alineamiento / cascada**

- WHEN abro un KR, THEN veo la cadena de alineamiento hasta la North Star.
- WHEN un objetivo no está vinculado a ningún objetivo superior ni pilar, THEN se muestra alerta de "objetivo huérfano". 🔒

**OKR-5 — Cierre de ciclo**

- WHEN termina el trimestre, THEN Dirección puede calificar cada KR (logrado / parcial / no logrado).
- WHEN se cierra un objetivo, THEN puede marcarse un KR para arrastrar al próximo ciclo.
- WHEN se cierra el ciclo, THEN los objetivos quedan archivados y consultables como histórico.

---

## CAP-S2 · Equipos (Teams) y Proyectos (Teams & Staffing)

**TEAM-1 — Crear teams y asignar personas**

- WHEN creo un team, THEN debo poder asignarle un nombre y una descripción que lo represente. 🔒
- WHEN creo un team, THEN puedo asignarle personas con un rol dentro del team.
- WHEN una persona pertenece a varios teams, THEN su capacidad se reparte entre ellos. 🔒

**TEAM-2 — Proyectos ligados a OKRs**

- WHEN creo un proyecto, THEN puedo vincularlo a uno o más objetivos.
- WHEN un proyecto no está vinculado a ningún objetivo, THEN se muestra alerta de "proyecto sin OKR". 🔒
- WHEN un KR no tiene ningún proyecto que lo mueva, THEN aparece como riesgo de desalineamiento.

**TEAM-3 — Capacidad y carga**

- WHEN se asignan personas a proyectos, THEN la capacidad del team se calcula como suma de asignaciones.
- WHEN un team o persona supera el 100%, THEN se marca "sobrecargado". 🔒
- WHEN Dirección ve el dashboard, THEN se refleja la carga/foco por proyecto y team.

---

## CAP-S7 · Skills & Staffing

**SKILL-1 — Matriz de competencias**

- WHEN se registra una competencia, THEN es la combinación Persona + Skill + Nivel (0 a 4).
- WHEN abro la matriz, THEN veo personas × skills con su nivel, filtrable por team.

**SKILL-2 — Staffing inteligente**

- WHEN existe una necesidad (KR o proyecto sin owner) con skills requeridas, THEN el sistema sugiere personas ordenadas por match.
- WHEN se calcula el match, THEN considera nivel de skill, seniority y disponibilidad. 🔒
- WHEN una persona sugerida está al 100% de capacidad, THEN se marca "sin margen" aunque su skill sea alta.

**SKILL-3 — Brechas de skills**

- WHEN varios OKRs requieren una skill sin cobertura suficiente, THEN se genera una alerta de brecha.
- WHEN una skill crítica depende de una sola persona, THEN se marca riesgo de "bus factor".

---

## CAP-S3 · Rituales de alineamiento (Rituals)

**RIT-1 — Cadencia de ceremonias**

- WHEN se configura una cadencia (weekly, quincenal), THEN se generan los rituales correspondientes.
- WHEN un ritual no se realiza en su fecha, THEN se marca "vencido". 🔒

**RIT-2 — Bloqueos**

- WHEN se registra un bloqueo, THEN tiene dueño y fecha de creación (antigüedad).
- WHEN un bloqueo frena un objetivo, THEN aparece asociado a ese objetivo en el dashboard.
- WHEN un bloqueo se resuelve, THEN sale de la lista de abiertos y cuenta en la métrica de resueltos.

**RIT-3 — Retrospectivas**

- WHEN se cumplen 2 ciclos sin retro en un team, THEN se marca riesgo de aprendizaje.

---

## CAP-S4 · Feedback y Desarrollo de carrera (Feedback & Growth)

**FB-1 — Dar y pedir feedback**

- WHEN doy feedback, THEN puedo vincularlo a un proyecto y/o a un valor de la empresa.
- WHEN pido feedback, THEN la solicitud llega a la persona indicada.
- WHEN el feedback marca una fortaleza o un área a mejorar, THEN queda clasificado como tal.

**FB-2 — Reconocimientos (kudos)**

- WHEN doy un kudo, THEN puedo asociarlo a un valor de la empresa.
- WHEN un kudo se asocia a un objetivo/resultado, THEN se refleja en la actividad del equipo.

**FB-3 — Plan de carrera**

- WHEN se define un plan de carrera, THEN apunta a niveles concretos de skills de la matriz (CAP-S7). 🔒
- WHEN se recibe feedback o se cierra un proyecto, THEN puede alimentar el avance del plan.
- WHEN abro un plan, THEN veo el próximo hito y el gap de skills a trabajar.

---

## CAP-S5 · Clima y eNPS (Culture)

**ENPS-1 — Lanzar un pulso**

- WHEN Dirección lanza un pulso, THEN se envía a las personas del alcance definido.
- WHEN se configura la frecuencia, THEN los pulsos se generan según esa cadencia.

**ENPS-2 — Responder (anonimato)**

- WHEN una persona responde, THEN su respuesta es **anónima e inmutable**. 🔒
- WHEN se intenta ver una respuesta individual, THEN el sistema no lo permite bajo ninguna circunstancia. 🔒
- WHEN un grupo tiene menos del **N mínimo configurable** (default 4, por Organization) de respuestas, THEN no se muestran resultados agregados de ese grupo (para no identificar individuos). 🔒
- WHEN Dirección configura el umbral de N mínimo, THEN la visibilidad de agregados usa ese valor.

**ENPS-3 — Resultados y drivers**

- WHEN hay respuestas suficientes, THEN se calcula el eNPS (promotores − detractores) global y por equipo.
- WHEN existen comentarios abiertos, THEN se agrupan en drivers/temas sin exponer autoría.
- WHEN un eNPS de equipo cae, THEN el sistema puede correlacionarlo con señales operativas (ej. capacidad, retro vencida).

---

## CAP-S6 · Motor Lean / Experimentación (Lean)

**LEAN-1 — Crear hipótesis**

- WHEN creo una hipótesis, THEN debe vincularse a un key result. 🔒
- WHEN registro la hipótesis, THEN uso el formato "Creemos que X → esperamos Y".

**LEAN-2 — Ciclo del experimento**

- WHEN un experimento avanza, THEN pasa por los estados Hipótesis → Construyendo → Midiendo → Aprendido.
- WHEN un experimento está en "Midiendo", THEN tiene una métrica tipada y una fecha de corte. 🔒

**LEAN-3 — Cierre y aprendizaje**

- WHEN cierro un experimento, THEN debo registrar un aprendizaje y una decisión (perseverar / pivotar); no se puede cerrar sin ambos. 🔒
- WHEN se registra el aprendizaje, THEN queda con el formato Creíamos / Probamos / Aprendimos / Decisión.
- WHEN un aprendizaje se archiva, THEN queda consultable en la biblioteca de aprendizajes, vinculado a su KR y objetivo.

---

## CAP-DASH · Dashboard ejecutivo (transversal)

**DASH-1 — Vista consolidada**

- WHEN Dirección abre el dashboard, THEN ve el avance global de OKRs, salud de equipos, clima/eNPS y velocidad de aprendizaje.
- WHEN cambia cualquier dato de un contexto, THEN el widget correspondiente lo refleja.

**DASH-2 — Riesgos de desalineamiento (automáticos)**

- WHEN un KR no tiene proyecto/owner, un team supera capacidad, una retro está vencida o un grupo tiene feedback bajo, THEN se genera una alerta de riesgo priorizada. 🔒
- WHEN un riesgo se resuelve, THEN desaparece de la lista.

**DASH-3 — Vistas por rol**

- WHEN un Líder abre su vista, THEN ve la misma data acotada a su team y traducida a acciones sugeridas.
- WHEN un Colaborador abre su vista, THEN ve sus objetivos, su carga, su feedback, su crecimiento y su pulso.

---

## Requisitos no funcionales (globales)

- 🔒 **Multi-tenancy:** aislamiento total de datos entre organizaciones.
- 🔒 **Anonimato eNPS:** ninguna respuesta individual es recuperable; umbral de N mínimo para agregados.
- **Auditoría:** cambios en OKRs, permisos e importaciones quedan registrados.
- **Editabilidad:** todo lo generado por IA/templates/import es editable por el usuario.
- **Idioma:** español (LATAM) como idioma base.
- **Trazabilidad de valores tipados:** un mismo `Measurement` tipado se usa en OKRs, North Star y Experimentos (un solo modelo).

---

## Fuera de alcance del MVP (⏳ fase 2)

Payroll, legajos, nómina, control horario, beneficios, HRIS completo, evaluaciones de desempeño complejas (360 formales), marketplace de learning, compensaciones/promociones, campos custom arbitrarios (EAV), automatizaciones enterprise, integraciones (Slack/Jira/Calendar), copiloto de IA de uso diario.

---

_Marcá con comentarios lo que quieras ajustar, agregar o sacar. Con esto validado, lo bajamos a specs de OpenSpec (una capability por archivo) + los ADRs._
