import type { Measurement } from "../../../shared/measurement";
import { DomainError } from "../../../shared/errors";

export type OnboardingTemplateKey = "saas-product" | "services-agency" | "commerce-retail";

export interface TemplateKeyResult {
  readonly title: string;
  readonly measurement: Measurement;
}

export interface TemplateObjective {
  readonly title: string;
  readonly keyResults: readonly TemplateKeyResult[];
}

export interface OnboardingTemplate {
  readonly key: OnboardingTemplateKey;
  readonly name: string;
  readonly description: string;
  readonly teams: readonly string[];
  readonly northStar: {
    readonly name: string;
    readonly measurement: Measurement;
  };
  readonly objectives: readonly TemplateObjective[];
  readonly skills: readonly string[];
}

export interface TemplateRecommendationProfile {
  readonly companyType: string;
  readonly industry: string;
}

export const onboardingTemplateCatalog: readonly OnboardingTemplate[] = [
  {
    key: "saas-product",
    name: "SaaS de Producto",
    description: "Una base para alinear producto, crecimiento y éxito del cliente.",
    teams: ["Producto", "Growth", "Customer Success", "Diseño"],
    northStar: {
      name: "Pymes activas que renuevan y crecen",
      measurement: { type: "integer", start: 0, target: 100, current: 0 },
    },
    objectives: [
      {
        title: "Aumentar la adopción del producto",
        keyResults: [
          {
            title: "Lograr 70% de activación de nuevas cuentas",
            measurement: { type: "percentage", start: 0, target: 70, current: 0 },
          },
        ],
      },
      {
        title: "Construir un motor de crecimiento repetible",
        keyResults: [
          {
            title: "Alcanzar 40 oportunidades calificadas por mes",
            measurement: { type: "integer", start: 0, target: 40, current: 0 },
          },
        ],
      },
      {
        title: "Mejorar la retención de clientes",
        keyResults: [
          {
            title: "Llegar a 92% de renovación",
            measurement: { type: "percentage", start: 0, target: 92, current: 0 },
          },
        ],
      },
      {
        title: "Elevar la calidad de la experiencia",
        keyResults: [
          {
            title: "Completar la nueva experiencia principal",
            measurement: { type: "check", done: false },
          },
        ],
      },
    ],
    skills: ["Discovery", "Data", "Growth", "Customer Operations", "Diseño", "Ingeniería"],
  },
  {
    key: "services-agency",
    name: "Servicios / Agencia",
    description: "Una estructura para entregar con calidad y crecer por recomendación.",
    teams: ["Cuentas", "Creativo", "Delivery", "New Business"],
    northStar: {
      name: "Clientes que renuevan y recomiendan",
      measurement: { type: "percentage", start: 0, target: 90, current: 0 },
    },
    objectives: [
      {
        title: "Aumentar la confianza de los clientes",
        keyResults: [
          {
            title: "Alcanzar 90% de renovaciones",
            measurement: { type: "percentage", start: 0, target: 90, current: 0 },
          },
        ],
      },
      {
        title: "Mejorar la previsibilidad de las entregas",
        keyResults: [
          {
            title: "Entregar 95% de los proyectos en fecha",
            measurement: { type: "percentage", start: 0, target: 95, current: 0 },
          },
        ],
      },
    ],
    skills: ["Gestión de cuentas", "Creatividad", "Producción", "Estrategia"],
  },
  {
    key: "commerce-retail",
    name: "Comercio / Retail",
    description: "Una base para coordinar ventas, operación y recurrencia de clientes.",
    teams: ["Comercial", "Operaciones", "Marketing", "Post-venta"],
    northStar: {
      name: "Clientes recurrentes que crecen en ticket",
      measurement: { type: "integer", start: 0, target: 1_000, current: 0 },
    },
    objectives: [
      {
        title: "Aumentar la recurrencia de compra",
        keyResults: [
          {
            title: "Lograr 35% de clientes recurrentes",
            measurement: { type: "percentage", start: 0, target: 35, current: 0 },
          },
        ],
      },
      {
        title: "Mejorar la eficiencia operativa",
        keyResults: [
          {
            title: "Completar 95% de pedidos sin incidencias",
            measurement: { type: "percentage", start: 0, target: 95, current: 0 },
          },
        ],
      },
    ],
    skills: ["Ventas", "Operaciones", "Marketing", "Post-venta"],
  },
] as const;

export function isOnboardingTemplateKey(value: string): value is OnboardingTemplateKey {
  return onboardingTemplateCatalog.some((template) => template.key === value);
}

export function onboardingTemplate(key: OnboardingTemplateKey): OnboardingTemplate {
  const template = onboardingTemplateCatalog.find((candidate) => candidate.key === key);
  if (!template) {
    throw new DomainError(
      "onboarding-setup/template-not-found",
      "Onboarding template does not exist",
    );
  }
  return template;
}

function normalized(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function includesAny(value: string, candidates: readonly string[]): boolean {
  return candidates.some(
    (candidate) =>
      value === candidate ||
      value.startsWith(`${candidate} `) ||
      value.endsWith(` ${candidate}`) ||
      value.includes(` ${candidate} `),
  );
}

export function recommendOnboardingTemplate(
  profile: TemplateRecommendationProfile,
): OnboardingTemplate {
  const companyType = normalized(profile.companyType);
  const industry = normalized(profile.industry);
  let key: OnboardingTemplateKey = "services-agency";

  if (includesAny(companyType, ["comercio", "retail", "ecommerce", "e-commerce"])) {
    key = "commerce-retail";
  } else if (includesAny(companyType, ["servicio", "agencia", "consultor", "estudio"])) {
    key = "services-agency";
  } else if (includesAny(companyType, ["producto", "saas", "software", "startup"])) {
    key = "saas-product";
  } else if (includesAny(industry, ["retail", "comercio", "ecommerce", "e-commerce"])) {
    key = "commerce-retail";
  } else if (includesAny(industry, ["marketing", "publicidad", "consultoria"])) {
    key = "services-agency";
  } else if (includesAny(industry, ["tecnologia", "software", "saas"])) {
    key = "saas-product";
  }

  return onboardingTemplate(key);
}
