# identity-org (delta)

Delta de la capability `identity-org` para el change `dev-auth-mock`.

## ADDED Requirements

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
