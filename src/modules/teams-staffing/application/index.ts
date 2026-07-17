// Public interface of the teams-staffing module (ADR-0002: cross-module
// access goes only through application/).
export { createTeam, type CreateTeamInput } from "./create-team";
export { assignTeamMember, type AssignTeamMemberInput } from "./assign-team-member";
export {
  listMemberLoads,
  listTeamCapacities,
  type MemberLoadView,
  type TeamCapacityView,
} from "./capacity-views";
export { createProject, type CreateProjectInput } from "./create-project";
export {
  linkProjectToObjectives,
  type LinkProjectToObjectivesInput,
} from "./link-project-to-objectives";
export { evaluateAlignment, type EvaluateAlignmentInput } from "./evaluate-alignment";
export type { TeamRole } from "../domain/team-role";
export type { AlignmentAlerts } from "../domain/alignment";
export { listTeamAssignments, type TeamAssignmentView } from "./list-team-assignments";
