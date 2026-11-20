import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '../lib/logger';

/** Boş durum: ne olduğunu ve bir sonraki adımı söyler. */
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-panel border border-dashed border-line-strong/50 px-6 py-10 sm:items-center sm:text-center">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {children && <p className="max-w-prose text-[0.9375rem] text-ink-2">{children}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/** İskelet satırlar: içerik gelene kadar yerini tutar. */
export function SkeletonRows({ rows = 4, label }: { rows?: number; label: string }) {
  return (
    <div role="status" aria-label={label} className="divide-y divide-line">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex flex-col gap-2 py-4">
          <div className="h-4 w-2/5 rounded bg-sunken animate-shimmer" />
          <div className="h-3 w-3/5 rounded bg-sunken animate-shimmer" />
        </div>
      ))}
    </div>
  );
}

export function InlineError({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-panel bg-danger-soft px-4 py-3 text-[0.9375rem] text-danger sm:flex-row sm:items-center sm:justify-between"
    >
      <p>{children}</p>
      {action}
    </div>
  );
}

export function Notice({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'warn';
  children: ReactNode;
}) {
  const cls = tone === 'warn' ? 'bg-warn-soft text-warn' : 'bg-sunken text-ink-2';
  return <div className={`rounded-panel px-4 py-3 text-sm leading-relaxed ${cls}`}>{children}</div>;
}

interface BoundaryState {
  error: Error | null;
}

/** Görüntüleme hatasında boş ekran yerine kurtarma yolu gösterir. */
export class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('render error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6">
        <h1 className="text-xl font-semibold">Sayfa görüntülenemedi</h1>
        <p className="text-ink-2">
          Beklenmeyen bir hata oluştu. Verileriniz silinmedi. Sayfayı yenileyip yeniden deneyin.
        </p>
        <button
          type="button"
          className="h-11 w-fit rounded-control bg-accent px-4 font-medium text-accent-ink"
          onClick={() => window.location.reload()}
        >
          Sayfayı yenile
        </button>
      </main>
    );
  }
}
