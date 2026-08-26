import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const DRAWER_SOURCE = readFileSync(join(__dirname, "entity-create-drawer.tsx"), "utf8");
const SHEET_SOURCE = readFileSync(join(__dirname, "ui/sheet.tsx"), "utf8");

describe("EntityCreateDrawer shared component", () => {
  it("is a client component built on the Sheet primitive from radix-ui", () => {
    expect(DRAWER_SOURCE).toMatch(/^"use client"/);
    expect(DRAWER_SOURCE).toMatch(/from ["']@\/components\/ui\/sheet["']/);
    expect(SHEET_SOURCE).toMatch(/from ["']radix-ui["']/);
  });

  it("exposes a trigger, title, description and a children render-prop with close", () => {
    expect(DRAWER_SOURCE).toContain("triggerLabel");
    expect(DRAWER_SOURCE).toContain("title:");
    expect(DRAWER_SOURCE).toContain("description");
    expect(DRAWER_SOURCE).toContain("close");
    expect(DRAWER_SOURCE).toContain("children");
  });

  it("anchors the panel to the right spanning the full height with a scrim", () => {
    expect(SHEET_SOURCE).toContain('side = "right"');
    expect(SHEET_SOURCE).toContain("data-[side=right]:right-0");
    expect(SHEET_SOURCE).toContain("data-[side=right]:h-full");
    expect(SHEET_SOURCE).toContain("SheetOverlay");
    expect(SHEET_SOURCE).toContain("fixed inset-0");
  });

  it("keeps the body scrollable while the header and footer stay fixed", () => {
    expect(DRAWER_SOURCE).toContain("SheetHeader");
    expect(DRAWER_SOURCE).toContain("SheetFooter");
    expect(DRAWER_SOURCE).toContain("overflow-y-auto");
  });

  it("renders a Cancel action in the footer", () => {
    expect(DRAWER_SOURCE).toContain("Cancelar");
  });
});
