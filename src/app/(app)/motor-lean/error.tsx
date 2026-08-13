"use client";
export default function ErrorView({ reset }: { reset: () => void }) {
  return (
    <main className="p-10">
      <h1>No pudimos cargar Motor Lean</h1>
      <button onClick={reset}>Reintentar</button>
    </main>
  );
}
