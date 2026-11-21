import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';

type Kind = 'success' | 'error';

interface ToastItem {
  id: number;
  kind: Kind;
  message: string;
  action?: { label: string; run: () => void };
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string, action?: ToastItem['action']) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = use(ToastContext);
  if (!api) throw new Error('useToast yalnız ToastProvider içinde kullanılır.');
  return api;
}

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback(
    (id: number) => setItems((list) => list.filter((t) => t.id !== id)),
    [],
  );

  const push = useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = ++seq;
      setItems((list) => [...list.slice(-3), { ...item, id }]);
      // Başarı bildirimi kendiliğinden kapanır; hata kullanıcı kapatana kadar kalır.
      if (item.kind === 'success') setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push({ kind: 'success', message }),
      error: (message, action) => push({ kind: 'error', message, action }),
    }),
    [push],
  );

  const render = (kind: Kind) =>
    items
      .filter((t) => t.kind === kind)
      .map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex w-full items-start gap-3 rounded-panel border border-line bg-surface px-4 py-3 text-sm text-ink shadow-float animate-enter"
        >
          {t.kind === 'success' ? (
            <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ok" />
          ) : (
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" />
          )}
          <p className="flex-1 leading-snug">{t.message}</p>
          {t.action && (
            <button
              type="button"
              className="shrink-0 font-medium text-accent-text underline-offset-2 hover:underline"
              onClick={() => {
                t.action?.run();
                dismiss(t.id);
              }}
            >
              {t.action.label}
            </button>
          )}
          <button
            type="button"
            aria-label="Bildirimi kapat"
            className="-m-1 shrink-0 rounded-control p-1 text-ink-3 hover:text-ink"
            onClick={() => dismiss(t.id)}
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      ));

  return (
    <ToastContext value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-20 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96">
        <div role="status" aria-live="polite" className="flex w-full flex-col gap-2">
          {render('success')}
        </div>
        <div role="alert" aria-live="assertive" className="flex w-full flex-col gap-2">
          {render('error')}
        </div>
      </div>
    </ToastContext>
  );
}
