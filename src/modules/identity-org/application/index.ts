// Public interface of the identity-org module (ADR-0002: cross-module access
// goes only through application/).
export { createOrganization, type CreateOrganizationInput } from "./create-organization";
export { inviteMember, type InviteMemberInput } from "./invite-member";
export { listMembers } from "./list-members";
export { changeMemberRole, type ChangeMemberRoleInput } from "./change-member-role";
export type { Role } from "../domain/roles";
export { ROLES } from "../domain/roles";
export { canEditOrganization, canManageMembers } from "../domain/permissions";
export { requireActor } from "./actor";
export { setMemberSeniority, type SetMemberSeniorityInput } from "./set-member-seniority";
export { seniorityRank, SENIORITIES, type Seniority } from "../domain/seniority";
