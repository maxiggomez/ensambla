import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CollapsibleSection, StrategyDetailSections } from "./collapsible-section";

describe("CollapsibleSection", () => {
  it("starts collapsed and exposes an accessible header control", () => {
    const html = renderToStaticMarkup(
      <CollapsibleSection id="strategy" open={false} title="Estrategia" onToggle={() => {}}>
        <button>Guardar estrategia</button>
      </CollapsibleSection>,
    );

    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="strategy-content"');
    expect(html).not.toContain("Guardar estrategia");
  });

  it("renders all detail headings collapsed by default", () => {
    const html = renderToStaticMarkup(
      <StrategyDetailSections
        strategy={<span>Contenido estrategia</span>}
        northStar={<span>Contenido North Star</span>}
        pillars={<span>Contenido pilares</span>}
      />,
    );

    expect(html.match(/aria-expanded="false"/g)).toHaveLength(3);
    expect(html).toContain("Estrategia");
    expect(html).toContain("North Star");
    expect(html).toContain("Pilares");
    expect(html).not.toContain("Contenido estrategia");
    expect(html).toContain("Expandir todo");
    expect(html).toContain("Contraer todo");
  });
});
