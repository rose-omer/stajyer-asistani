import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Compass,
  History,
  Layers,
  ListChecks,
  LogOut,
  Search,
  Settings,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { href, ROUTES, type Route } from '../lib/router';
import { BrandMark } from './Brand';
import { Badge } from './StatusBadge';

/** Üst çubuktaki arama kutusu yalnız liste sayfalarında görünür. */
const SEARCHABLE: Route[] = ['havuz', 'kuyruk', 'gecmis'];

const SearchContext = createContext('');

/** Üst çubuktaki arama sorgusu. Liste sayfaları satırlarını buna göre süzer. */
export function useSearchQuery(): string {
  return use(SearchContext);
}

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
  historyCount: number;
  sentToday: number;
  dailyLimit: number;
  demo: boolean;
  initials: string;
  userEmail?: string;
  onSignOut?: () => void;
  children: ReactNode;
}

export function AppShell({
  route,
  poolCount,
  queueCount,
  historyCount,
  sentToday,
  dailyLimit,
  demo,
  initials,
  userEmail,
  onSignOut,
  children,
}: AppShellProps) {
  const items: NavItem[] = [
    { route: 'profil', icon: UserRound, short: 'Profil' },
    { route: 'kesfet', icon: Compass, short: 'Keşfet' },
    { route: 'havuz', icon: Layers, short: 'Havuz', count: poolCount },
    { route: 'kuyruk', icon: ListChecks, short: 'Kuyruk', count: queueCount },
    { route: 'gecmis', icon: History, short: 'Geçmiş', count: historyCount },
  ];
  const railItems: NavItem[] = [...items, { route: 'ayarlar', icon: Settings, short: 'Ayarlar' }];

  // Sorgu rotaya bağlı: başka sayfaya geçince kendiliğinden boşalır.
  const [search, setSearch] = useState({ route, query: '' });
  const query = search.route === route ? search.query : '';
  const searchable = SEARCHABLE.includes(route);

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
  const used = Math.min(sentToday, dailyLimit);
  const left = Math.max(0, dailyLimit - sentToday);

  return (
    <div className="flex min-h-dvh flex-col split:h-dvh split:overflow-hidden">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
        className="sr-only z-50 rounded-control bg-accent px-4 py-2 font-semibold text-accent-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        İçeriğe geç
      </a>

      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-surface px-4 py-2.5 sm:gap-x-4 split:px-6">
        <div className="mr-auto flex min-w-0 items-center gap-2.5">
          <BrandMark />
          <span className="truncate text-[1.0625rem] font-bold tracking-[-0.01em] text-ink">
            Stajyer Asistanı
          </span>
          {demo && <Badge tone="warn">Demo</Badge>}
        </div>

        {searchable && (
          <div className="order-last flex min-h-11 basis-full items-center gap-2 rounded-control bg-canvas px-3.5 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent sm:order-none sm:max-w-[30rem] sm:flex-[1_1_18rem]">
            <Search aria-hidden="true" className="size-[1.125rem] shrink-0 text-ink-2" />
            <label htmlFor="ust-arama" className="sr-only">
              Şirket ya da alıcı ara
            </label>
            <input
              id="ust-arama"
              type="search"
              placeholder="Şirket ya da alıcı ara"
              value={query}
              onChange={(e) => setSearch({ route, query: e.target.value })}
              className="min-h-10 min-w-0 flex-1 border-0 bg-transparent text-base text-ink placeholder:text-ink-3 focus:outline-none split:text-[0.9375rem]"
            />
          </div>
        )}

        <p className="tabular hidden text-ink-2 md:block">
          Bugün{' '}
          <strong className="font-semibold text-ink">
            {sentToday} / {dailyLimit}
          </strong>{' '}
          mail gönderildi
        </p>

        <a
          href={href('ayarlar')}
          aria-label="Ayarlar"
          aria-current={current('ayarlar')}
          className="grid size-11 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-sunken hover:text-ink aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent-text split:hidden"
        >
          <Settings aria-hidden="true" className="size-5" />
        </a>
        <a
          href={href('profil')}
          aria-label="Profil"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft font-semibold text-accent-text transition-colors duration-150 hover:bg-accent hover:text-accent-ink"
        >
          {initials ? (
            <span aria-hidden="true">{initials}</span>
          ) : (
            <UserRound aria-hidden="true" className="size-5" />
          )}
        </a>
      </header>

      <div className="flex min-h-0 flex-1 flex-col split:grid split:grid-cols-[13.5rem_minmax(0,1fr)]">
        {/* Geniş ekran: sol gezinme rayı */}
        <nav
          aria-label="Ana gezinme"
          className="hidden flex-col overflow-y-auto border-r border-line px-3 py-5 split:flex"
        >
          <ul className="flex flex-col gap-0.5">
            {railItems.map((item) => (
              <li key={item.route}>
                <a
                  href={href(item.route)}
                  aria-current={current(item.route)}
                  className="flex min-h-11 items-center gap-3 rounded-control px-3 text-ink-2 transition-colors duration-150 hover:bg-sunken hover:text-ink aria-[current=page]:bg-accent-soft aria-[current=page]:font-semibold aria-[current=page]:text-accent-text"
                >
                  <span className="flex-1">{ROUTES[item.route]}</span>
                  {item.count ? <span className="tabular">{item.count}</span> : null}
                </a>
              </li>
            ))}
          </ul>

          <div className="mx-3 mt-6 flex flex-col gap-2 border-t border-line pt-4 text-sm text-ink-2">
            <p>Günlük hak</p>
            <div
              role="img"
              aria-label={`${dailyLimit} haktan ${used} tanesi kullanıldı`}
              className="h-2 overflow-hidden rounded-full bg-line"
            >
              <div
                className="h-full bg-accent"
                style={{ width: `${dailyLimit ? (used / dailyLimit) * 100 : 0}%` }}
              />
            </div>
            <p className="tabular">{left} gönderim hakkın kaldı</p>
          </div>

          {userEmail && (
            <div className="mx-3 mt-auto flex items-center justify-between gap-2 border-t border-line pt-4 text-sm">
              <span className="truncate text-ink-2" title={userEmail}>
                {userEmail}
              </span>
              <button
                type="button"
                onClick={onSignOut}
                aria-label="Oturumu kapat"
                className="grid size-9 shrink-0 place-items-center rounded-control text-ink-2 hover:bg-sunken hover:text-ink"
              >
                <LogOut aria-hidden="true" className="size-4" />
              </button>
            </div>
          )}
        </nav>

        <main
          id="main"
          tabIndex={-1}
          className="min-w-0 flex-1 pb-20 outline-none split:min-h-0 split:overflow-hidden split:pb-0"
        >
          <SearchContext value={query}>{children}</SearchContext>
        </main>
      </div>

      {/* Dar ekran: alt gezinme (5 öğe); Ayarlar üst çubukta */}
      <nav
        aria-label="Ana gezinme"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] split:hidden"
      >
        <ul className="grid grid-cols-5">
          {items.map((item) => (
            <li key={item.route}>
              <a
                href={href(item.route)}
                aria-current={current(item.route)}
                className="relative flex h-16 flex-col items-center justify-center gap-1 text-xs text-ink-2 aria-[current=page]:font-semibold aria-[current=page]:text-accent-text"
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
  );
}
