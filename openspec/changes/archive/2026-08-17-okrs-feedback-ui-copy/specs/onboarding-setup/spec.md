## MODIFIED Requirements

### Requirement: Guided setup flow

The system SHALL persist one tenant-owned setup progress record per Organization and SHALL offer
its stepped setup flow immediately after a new Organization is created and on later visits while
the progress remains pending. Only Dirección SHALL mutate setup progress. The flow SHALL allow
Dirección to save company type and industry, move backward without losing saved data, finish the
basic setup, or skip it and access an empty application that remains configurable later. Existing
Organizations created before this flow is deployed SHALL NOT be forced into onboarding. The copy
of the guided steps SHALL follow the product's Spanish (LATAM) convention, keeping ubiquitous
terms as standalone nouns ("Objetivos y Key Results").

#### Scenario: Guided setup renders the steps in Spanish canonical copy

- GIVEN Dirección is going through the guided setup flow
- WHEN the step sections are rendered
- THEN the sections follow the product's Spanish copy with its ubiquitous terms
  ("Objetivos y Key Results") instead of mixed-language labels

#### Scenario: Offer setup on first entry

- GIVEN a freshly created Organization
- WHEN its Dirección enters the application
- THEN guided setup is offered immediately