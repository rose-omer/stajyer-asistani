import type { ReactNode } from 'react';

/**
 * Sayfa başlığı. Rota değişince AppShell odağı bu h1'e taşır.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-[62ch] flex-col gap-1.5">
        <h1
          tabIndex={-1}
          data-route-heading
          className="text-[1.625rem] leading-tight font-semibold tracking-[-0.015em] text-ink"
        >
          {title}
        </h1>
        {description && <p className="text-[0.9375rem] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/** Sayfa içi bölüm: başlık + içerik. Kart yığını yerine çizgiyle ayrılır. */
export function Section({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-panel border border-line bg-surface">
      <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description && <p className="text-sm text-ink-2">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}
