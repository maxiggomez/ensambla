import { DRIVERS, type Driver } from "./driver";

export interface DriverGroup {
  driver: Driver;
  count: number;
  comments: string[];
}

export function groupCommentsByDriver<T extends { driver: Driver; comment: string | null }>(
  responses: T[],
): DriverGroup[] {
  const grouped = new Map<Driver, { count: number; comments: string[] }>();
  for (const response of responses) {
    const group = grouped.get(response.driver) ?? { count: 0, comments: [] };
    group.count += 1;
    if (response.comment !== null) {
      group.comments.push(response.comment);
    }
    grouped.set(response.driver, group);
  }

  return DRIVERS.flatMap((driver) => {
    const group = grouped.get(driver);
    return group ? [{ driver, ...group }] : [];
  });
}
