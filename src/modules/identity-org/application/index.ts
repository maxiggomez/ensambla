// Public interface of the identity-org module (ADR-0002: cross-module access
// goes only through application/).
export { createOrganization, type CreateOrganizationInput } from "./create-organization";
export { inviteMember, type InviteMemberInput } from "./invite-member";
export { listMembers } from "./list-members";
export { changeMemberRole, type ChangeMemberRoleInput } from "./change-member-role";
export type { Role } from "../domain/roles";
export { ROLES } from "../domain/roles";
export { canManageMembers } from "../domain/permissions";
