import { useEffect, useRef, type ReactNode } from 'react';
import {
  Compass,
  History,
  Layers,
  ListChecks,
  LogOut,
  Settings,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { href, ROUTES, type Route } from '../lib/router';
import { BrandMark } from './Brand';

interface NavItem {
  route: Route;
  icon: LucideIcon;
  short: string;
  count?: number;
}

interface AppShellProps {
  route: Route;
  poolCount: number;
  queueCount: number;
  sentToday: number;
  dailyLimit: number;
  modeLabel: string;
  userEmail?: string;
  onSignOut?: () => void;
  children: ReactNode;
}

export function AppShell({
  route,
  poolCount,
  queueCount,
  sentToday,
  dailyLimit,
  modeLabel,
  userEmail,
  onSignOut,
  children,
}: AppShellProps) {
  const items: NavItem[] = [
    { route: 'profil', icon: UserRound, short: 'Profil' },
    { route: 'kesfet', icon: Compass, short: 'Keşfet' },
    { route: 'havuz', icon: Layers, short: 'Havuz', count: poolCount },
    { route: 'kuyruk', icon: ListChecks, short: 'Kuyruk', count: queueCount },
    { route: 'gecmis', icon: History, short: 'Geçmiş' },
  ];

  // Rota değişince odağı yeni sayfanın başlığına taşı (ilk yüklemede değil).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    document.querySelector<HTMLElement>('[data-route-heading]')?.focus();
    window.scrollTo({ top: 0 });
  }, [route]);

  const current = (r: Route) => (route === r ? 'page' : undefined);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_1fr]">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
        className="sr-only z-50 rounded-control bg-accent px-4 py-2 text-accent-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        İçeriğe geç
      </a>

      {/* Masaüstü: sol kenar çubuğu */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface lg:flex">
        <div className="flex items-center gap-3 px-5 pt-6 pb-5">
          <BrandMark />
          <div className="min-w-0">
            <p className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink">
              Stajyer Asistanı
            </p>
            <p className="mt-0.5 text-xs text-ink-3">{modeLabel}</p>
          </div>
        </div>
        <nav aria-label="Ana gezinme" className="flex-1 px-3">
          <ul className="flex flex-col gap-0.5">
            {[...items, { route: 'ayarlar' as Route, icon: Settings, short: 'Ayarlar' }].map(
              (item) => (
                <li key={item.route}>
                  <a
                    href={href(item.route)}
                    aria-current={current(item.route)}
                    className="group flex h-10 items-center gap-3 rounded-control px-3 text-[0.9375rem] text-ink-2 transition-colors duration-150 hover:bg-sunken hover:text-ink aria-[current=page]:bg-accent-soft aria-[current=page]:font-medium aria-[current=page]:text-accent-text"
                  >
                    <item.icon aria-hidden="true" className="size-[1.125rem] shrink-0" />
                    <span className="flex-1">{ROUTES[item.route]}</span>
                    {item.count ? (
                      <span className="tabular text-xs text-ink-3 group-aria-[current=page]:text-accent-text">
                        {item.count}
                      </span>
                    ) : null}
                  </a>
                </li>
              ),
            )}
          </ul>
        </nav>
        <div className="flex flex-col gap-3 border-t border-line px-5 py-4 text-sm">
          <p className="text-ink-2">
            Bugünkü gönderim{' '}
            <span className="tabular font-medium text-ink">
              {sentToday} / {dailyLimit}
            </span>
          </p>
          {userEmail && (
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-ink-3" title={userEmail}>
                {userEmail}
              </span>
              <button
                type="button"
                onClick={onSignOut}
                aria-label="Oturumu kapat"
                className="rounded-control p-1.5 text-ink-3 hover:bg-sunken hover:text-ink"
              >
                <LogOut aria-hidden="true" className="size-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        {/* Mobil: üst çubuk */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/95 px-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <BrandMark size="sm" />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-ink">Stajyer Asistanı</span>
              <span className="text-xs text-ink-3">{modeLabel}</span>
            </div>
          </div>
          <a
            href={href('ayarlar')}
            aria-label="Ayarlar"
            aria-current={current('ayarlar')}
            className="rounded-control p-2.5 text-ink-2 hover:bg-sunken aria-[current=page]:text-accent-text"
          >
            <Settings aria-hidden="true" className="size-5" />
          </a>
        </header>

        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 outline-none sm:px-6 lg:px-10 lg:pt-10 lg:pb-16"
        >
          {children}
        </main>

        {/* Mobil: alt gezinme (5 öğe) */}
        <nav
          aria-label="Ana gezinme"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          <ul className="grid grid-cols-5">
            {items.map((item) => (
              <li key={item.route}>
                <a
                  href={href(item.route)}
                  aria-current={current(item.route)}
                  className="relative flex h-16 flex-col items-center justify-center gap-1 text-xs text-ink-3 aria-[current=page]:font-medium aria-[current=page]:text-accent-text"
                >
                  <item.icon aria-hidden="true" className="size-5" />
                  {item.short}
                  {item.count ? (
                    <span className="tabular absolute top-2 left-[calc(50%+0.5rem)] min-w-[1.125rem] rounded-full bg-accent px-1 text-center text-[0.6875rem] leading-[1.125rem] text-accent-ink">
                      {item.count}
                      <span className="sr-only"> öğe</span>
                    </span>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
