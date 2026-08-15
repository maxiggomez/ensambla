import {
  onboardingTemplateCatalog,
  recommendOnboardingTemplate,
  type OnboardingTemplate,
  type OnboardingTemplateKey,
  type TemplateRecommendationProfile,
} from "../domain/template-catalog";

export interface OnboardingTemplateOptions {
  readonly templates: readonly OnboardingTemplate[];
  readonly recommendedKey: OnboardingTemplateKey;
}

export function getOnboardingTemplateOptions(
  profile: TemplateRecommendationProfile,
): OnboardingTemplateOptions {
  return {
    templates: onboardingTemplateCatalog,
    recommendedKey: recommendOnboardingTemplate(profile).key,
  };
}
