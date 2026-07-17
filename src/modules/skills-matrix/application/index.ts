// Public interface of the skills-matrix module (ADR-0002: cross-module access
// goes only through application/).
export { defineSkill, type DefineSkillInput } from "./define-skill";
export { setCompetency, type SetCompetencyInput } from "./set-competency";
export {
  getCompetencyMatrix,
  type CompetencyMatrix,
  type GetCompetencyMatrixInput,
  type MatrixRow,
} from "./get-competency-matrix";
export { addSkillRequirement, type AddSkillRequirementInput } from "./add-skill-requirement";
export { suggestStaffing, type SuggestStaffingInput } from "./suggest-staffing";
export { evaluateGaps, type EvaluateGapsInput } from "./evaluate-gaps";
export type { StaffingSuggestion } from "../domain/matching";
export type { SkillGaps } from "../domain/gaps";
