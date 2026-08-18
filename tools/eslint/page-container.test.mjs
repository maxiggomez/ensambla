import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import rule from "./page-container.mjs";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("page-container", rule, {
  valid: [
    {
      name: "standard page container",
      code: `export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 px-6 py-10 md:px-10">
      <h1>Hola</h1>
    </main>
  );
}`,
    },
    {
      name: "narrow page container keeps the padding contract",
      code: `export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-10 md:px-10">
      <h1>Miembros</h1>
    </main>
  );
}`,
    },
    {
      name: "wide page container keeps the padding contract",
      code: `export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10 md:px-10">
      <h1>Clima</h1>
    </main>
  );
}`,
    },
    {
      name: "async default export page",
      code: `export default async function Page() {
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 px-6 py-10 md:px-10">
      <h1>Hola</h1>
    </main>
  );
}`,
    },
    {
      name: "const arrow assigned before default export",
      code: `const Page = () => (
  <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 px-6 py-10 md:px-10">
    <h1>Hola</h1>
  </main>
);

export default Page;`,
    },
  ],
  invalid: [
    {
      name: "page root is a div (not the standard container)",
      code: `export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <h1>Hola</h1>
    </div>
  );
}`,
      errors: [{ messageId: "standardContainer" }],
    },
    {
      name: "main without vertical padding",
      code: `export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 px-6 md:px-10">
      <h1>Hola</h1>
    </main>
  );
}`,
      errors: [{ messageId: "standardContainer" }],
    },
    {
      name: "main with uniform padding instead of px-6 py-10 md:px-10",
      code: `export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-6">
      <h1>Miembros</h1>
    </main>
  );
}`,
      errors: [{ messageId: "standardContainer" }],
    },
    {
      name: "main not centered nor full width",
      code: `export default function Page() {
  return (
    <main className="flex w-full max-w-[1180px] flex-col gap-10 px-6 py-10 md:px-10">
      <h1>Hola</h1>
    </main>
  );
}`,
      errors: [{ messageId: "standardContainer" }],
    },
    {
      name: "page returns no main element",
      code: `export default function Page() {
  return (
    <>
      <h1>Hola</h1>
    </>
  );
}`,
      errors: [{ messageId: "standardContainer" }],
    },
    {
      name: "const arrow with div root before default export",
      code: `const Page = () => (
  <div className="flex flex-col gap-6">
    <h1>Hola</h1>
  </div>
);

export default Page;`,
      errors: [{ messageId: "standardContainer" }],
    },
  ],
});
