# identity-org (delta)

Delta de la capability `identity-org` para el change `foundation`.

## ADDED Requirements

### Requirement: Organization creation and tenant isolation

The system SHALL allow creating an Organization that is fully isolated from any other
Organization, and the creating user SHALL become a member with the Dirección (admin) role.

#### Scenario: Create an organization
- GIVEN a new authenticated user
- WHEN they create an Organization
- THEN the Organization is created
- AND the user becomes a member with the Dirección role

#### Scenario: Tenant data isolation
- GIVEN two different Organizations with their own data
- WHEN a request is scoped to one Organization
- THEN no data from the other Organization is accessible

### Requirement: Member invitation and management

The system SHALL allow inviting people to an Organization by email with an assigned role,
and SHALL NOT create a duplicate member when a person with the same email already exists
(the record is merged).

#### Scenario: Invite a new member
- GIVEN a user with permission to manage members
- WHEN they invite a person by email with a role
- THEN the person gains access to that Organization with the assigned role

#### Scenario: Avoid duplicate member
- GIVEN a person already a member of the Organization
- WHEN they are invited again with the same email
- THEN no duplicate is created and the existing record is kept

### Requirement: Role-based access

The system SHALL enforce role-based access: a Colaborador sees their own and public data
but cannot edit company objectives; a Líder can edit the OKRs, projects and people of
their Team only; Dirección can view and edit everything within its Organization.

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
