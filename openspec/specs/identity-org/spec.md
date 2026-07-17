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
