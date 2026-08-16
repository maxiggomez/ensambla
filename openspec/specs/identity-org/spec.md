# identity-org Specification

## Purpose

Gestionar Organizations (tenants), Members y el acceso por rol. Es el kernel del que
depende toda otra capability: aislamiento multi-tenant, identidad y permisos.

Ver ADR-0003 (multi-tenancy por RLS). Se introduce en el change `foundation`.
## Requirements
### Requirement: Organization creation and tenant isolation

The system SHALL allow creating an Organization fully isolated from any other
Organization, and the creating user SHALL become a member with the Dirección role.

#### Scenario: Create an organization
- GIVEN a new authenticated user
- WHEN they create an Organization
- THEN the Organization is created
- AND the user becomes a member with the Dirección role

#### Scenario: Tenant data isolation
- GIVEN two Organizations with their own data
- WHEN a request is scoped to one Organization
- THEN no data from the other Organization is accessible

### Requirement: Member invitation and management

The system SHALL allow inviting people by email with an assigned role, and SHALL NOT
create a duplicate member when a person with the same email already exists.
An invited person SHALL gain access to the Organization on their first login
with the invited email: their auth identity is linked to the existing Member
and every unlinked membership for that verified email is linked at once.

#### Scenario: Invite a new member
- GIVEN a user with permission to manage members
- WHEN they invite a person by email with a role
- THEN the person gains access to that Organization with the assigned role

#### Scenario: Avoid duplicate member
- GIVEN a person already a member of the Organization
- WHEN they are invited again with the same email
- THEN no duplicate is created and the existing record is kept

#### Scenario: Invited person gains access on first login
- GIVEN a Member invited by email that has never logged in
- WHEN a user authenticates whose verified email matches the invitation
- THEN the Member is linked to that auth identity
- AND the user enters the Organization with the assigned role

#### Scenario: Linking cannot capture someone else's membership
- GIVEN a Member invited with an email
- WHEN a user authenticates with a different verified email
- THEN no membership is linked and the user gets no access

#### Scenario: Invalid invitation shows a friendly error
- GIVEN a Dirección member on the members page
- WHEN they submit an invitation with an invalid email
- THEN a friendly error message is shown on the form
- AND no member is created

### Requirement: Role-based access

The system SHALL enforce role-based access: Colaborador sees own and public data but
cannot edit company objectives; Líder edits only their Team's OKRs, projects and people;
Dirección views and edits everything within its Organization. Concurrent role
changes SHALL NOT be able to leave the Organization without a Dirección member.

#### Scenario: Colaborador scope
- GIVEN a member with the Colaborador role
- WHEN they access the app
- THEN they see their own and public information
- AND they cannot edit company objectives

#### Scenario: Líder scope
- GIVEN a member with the Líder role
- WHEN they edit their Team's OKRs, projects or people
- THEN the changes are allowed
- AND editing another Team's data is not allowed

#### Scenario: Dirección scope
- GIVEN a member with the Dirección role
- WHEN they access any data within their Organization
- THEN they can view and edit it

#### Scenario: Concurrent demotions keep one Dirección
- GIVEN an Organization with exactly two Dirección members
- WHEN both are demoted concurrently
- THEN at most one demotion succeeds
- AND the Organization still has at least one Dirección member

### Requirement: Member seniority

The system SHALL allow recording an optional seniority for a Member (Junior,
SemiSenior or Senior), editable only by Dirección. Members without seniority
SHALL rank lowest in seniority-based ordering. The UI SHALL expose a
seniority control for Dirección in the skills matrix; Líder and Colaborador
SHALL NOT see it.

#### Scenario: Dirección sets a member's seniority
- GIVEN a user with the Dirección role
- WHEN they set a Member's seniority
- THEN the seniority is stored on the Member

#### Scenario: Non-Dirección cannot set seniority
- GIVEN a user with the Líder or Colaborador role
- WHEN they attempt to set a Member's seniority
- THEN the system rejects the action with a forbidden error

#### Scenario: Direction records a member's seniority from the UI
- GIVEN a Dirección member in the Skills page
- WHEN they set the seniority (Junior, SemiSenior or Senior) of a Member
- THEN the seniority is stored and available for staffing ordering

#### Scenario: Non-Direction members do not see the seniority control
- GIVEN a Líder or Colaborador member
- WHEN they open the Skills page
- THEN no seniority management control is shown

### Requirement: Local development auth mock

In local development, when `AUTH_MODE=mock` is set, the system SHALL
authenticate without Clerk: the sign-in page SHALL list a fixed set of
development users and selecting one SHALL establish a session for that user.
The mock SHALL expose the same auth contract the application already consumes
(a single opaque `userId`, a primary verified email, a full name), so that
tenant resolution and email linking behave as with a real authentication.
The mock mode SHALL only be active with the explicit `AUTH_MODE=mock` flag in
a non-production environment; otherwise the application SHALL use Clerk.
In mock mode the developer SHALL be able to switch to a different development
user and to sign out.

#### Scenario: Sign in with a preset development user
- GIVEN the app running locally with `AUTH_MODE=mock`
- WHEN the developer opens the sign-in page
- THEN a list of preset development users is shown
- AND choosing one establishes a session for that user

#### Scenario: Mock session resolves the tenant like a real user
- GIVEN a signed-in mock user whose verified email matches a Member
- WHEN they access a tenant-scoped page
- THEN they resolve the same Organization and role as with Clerk
- AND the mock `userId` flows through RLS scoping without changes

#### Scenario: Mock mode is unreachable in production
- GIVEN the app built with `NODE_ENV=production`
- WHEN a request targets the dev sign-in flow
- THEN the dev flow is not reachable and Clerk authentication is used

#### Scenario: Developer switches user and signs out
- GIVEN a signed-in mock user
- WHEN the developer changes user or signs out
- THEN the session switches to the new user or is cleared

