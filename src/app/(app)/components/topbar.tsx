"use client";

export function Topbar({ activeTitle }: { activeTitle: string }) {
  return (
    <header
      data-testid="topbar"
      className="flex h-16 items-center justify-between border-b border-line bg-card px-6"
    >
      <span className="truncate text-sm font-extrabold tracking-tight text-ink">
        {activeTitle}
      </span>
      <span
        aria-hidden
        className="hidden items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground sm:inline-flex"
      >
        <span className="size-1.5 rounded-full bg-brand-2" />
        Ensambla
      </span>
    </header>
  );
}
