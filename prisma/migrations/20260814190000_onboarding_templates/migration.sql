ALTER TABLE "onboarding_setup"
  ADD COLUMN "applied_template_key" TEXT;

ALTER TABLE "onboarding_setup"
  ADD CONSTRAINT "onboarding_setup_applied_template_valid" CHECK (
    "applied_template_key" IS NULL
    OR (
      "status" = 'Completed'
      AND "applied_template_key" IN (
        'saas-product',
        'services-agency',
        'commerce-retail'
      )
    )
  );

