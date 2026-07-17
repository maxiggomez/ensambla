export const TEAM_ROLES = ["Lead", "Contributor"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];
