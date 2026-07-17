# identity-org (delta)

Delta de la capability `identity-org` para el change `identity-org-hardening`.

## MODIFIED Requirements

### Requirement: Member invitation and management

The system SHALL allow inviting people by email with an assigned role, and SHALL NOT
create a duplicate member when a person with the same email already exists.
An invited person SHALL gain access to the Organization on their first login
with the invited email: their auth identity is linked to the existing Member
and every unlinked membership for that verified email is linked at once.

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

#### Scenario: Concurrent demotions keep one Dirección
- GIVEN an Organization with exactly two Dirección members
- WHEN both are demoted concurrently
- THEN at most one demotion succeeds
- AND the Organization still has at least one Dirección member
