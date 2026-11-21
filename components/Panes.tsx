import type { ReactNode } from 'react';

/**
 * "Posta masası" yerleşimi: solda liste bölmesi, sağda okuma bölmesi.
 * Geniş ekranda iki bölme yan yana ve ayrı kayar; dar ekranda alt alta dizilir.
 */
export function Panes({ children }: { children: ReactNode }) {
  return (
    <div className="split:grid split:h-full split:grid-cols-[minmax(0,23rem)_minmax(0,1fr)]">
      {children}
    </div>
  );
}

/** Bölme başlık satırı yüksekliği: liste başlığı ve okuma araç çubuğu aynı hizada durur. */
const BAR = 'flex min-h-[4.25rem] flex-wrap items-center gap-2 border-b border-line';

interface ListPaneProps {
  title: string;
  /** Başlığın yanındaki sayı (ör. kuyruktaki taslak sayısı). */
  count?: number;
  actions?: ReactNode;
  children: ReactNode;
}

/** Liste bölmesi. Sayfanın h1'i buradadır; rota değişince odak bu başlığa taşınır. */
export function ListPane({ title, count, actions, children }: ListPaneProps) {
  return (
    <section
      aria-label={title}
      className="flex flex-col border-b border-line bg-pane split:min-h-0 split:border-r split:border-b-0"
    >
      <div className={`${BAR} px-4 py-3 split:px-5`}>
        <div className="mr-auto flex items-baseline gap-2">
          <h1
            tabIndex={-1}
            data-route-heading
            className="text-lg leading-tight font-bold tracking-[-0.01em] text-ink"
          >
            {title}
          </h1>
          {count !== undefined && (
            <span className="tabular text-[0.9375rem] font-medium text-ink-3">
              {count}
              <span className="sr-only"> öğe</span>
            </span>
          )}
        </div>
        {actions}
      </div>
      <div className="split:min-h-0 split:flex-1 split:overflow-y-auto">{children}</div>
    </section>
  );
}

interface ReadingPaneProps {
  label: string;
  toolbar?: ReactNode;
  footer?: ReactNode;
  /** Okuma bölmesinde gösterilecek bir şey yoksa dar ekranda gizle. */
  wideOnly?: boolean;
  children: ReactNode;
}

/** Okuma bölmesi: üstte araç çubuğu, ortada kayan içerik, altta sabit onay şeridi. */
export function ReadingPane({ label, toolbar, footer, wideOnly, children }: ReadingPaneProps) {
  return (
    <section
      aria-label={label}
      className={`${wideOnly ? 'hidden split:flex' : 'flex'} min-w-0 flex-col bg-surface split:min-h-0`}
    >
      {toolbar && <div className={`${BAR} px-4 py-3 split:px-6`}>{toolbar}</div>}
      <div className="px-4 py-6 sm:px-6 split:min-h-0 split:flex-1 split:overflow-y-auto split:px-10 split:py-7">
        {children}
      </div>
      {footer && (
        <div className="border-t border-line bg-pane px-4 py-4 sm:px-6 split:px-10">{footer}</div>
      )}
    </section>
  );
}

/** Okuma bölmesindeki ana başlık (h2). Dar ekranda seçimden sonra odak buraya gelir. */
export function PaneTitle({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      tabIndex={-1}
      data-pane-heading
      className="text-2xl leading-tight font-bold tracking-[-0.015em] text-ink"
    >
      {children}
    </h2>
  );
}

interface PaneItemProps {
  active: boolean;
  onSelect: () => void;
  /** Satırın solundaki denetim (ör. toplu seçim kutusu). Düğmenin dışında durur. */
  leading?: ReactNode;
  children: ReactNode;
}

/** Liste satırı: seçili satır beyaz kâğıt ve vurgu çerçevesiyle öne çıkar. */
export function PaneItem({ active, onSelect, leading, children }: PaneItemProps) {
  return (
    <li
      className={`flex gap-3 border-b border-line px-4 py-4 split:px-5 ${
        active ? 'bg-surface shadow-[inset_0_0_0_2px_var(--accent)]' : 'hover:bg-surface/70'
      }`}
    >
      {leading}
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? 'true' : undefined}
        className="min-w-0 flex-1 rounded-control text-left"
      >
        {children}
      </button>
    </li>
  );
}

/** Satır içi başlık + sağda kısa bilgi (konum, tarih). */
export function ItemHead({ title, meta }: { title: ReactNode; meta?: ReactNode }) {
  return (
    <span className="flex items-baseline justify-between gap-2">
      <strong className="min-w-0 truncate text-base font-semibold text-ink">{title}</strong>
      {meta && <span className="shrink-0 text-[0.8125rem] text-ink-2">{meta}</span>}
    </span>
  );
}

/** Okuma bölmesi boşken: ne seçileceğini söyler. */
export function PanePlaceholder({ children }: { children: ReactNode }) {
  return <p className="max-w-[44ch] text-ink-3">{children}</p>;
}

/**
 * Dar ekranda bölmeler alt alta durur. Listeden seçim yapılınca okuma bölmesinin
 * başlığına odak ve kaydırma taşınır; geniş ekranda odak listede kalır.
 */
export function revealDetail(): void {
  if (typeof window.matchMedia !== 'function') return;
  if (window.matchMedia('(min-width: 68.75rem)').matches) return;
  requestAnimationFrame(() => {
    const heading = document.querySelector<HTMLElement>('[data-pane-heading]');
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: 'start' });
  });
}
