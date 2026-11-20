import { useSyncExternalStore } from 'react';

/**
 * Hash tabanlı rotalar (#/profil). Geri tuşu ve derin bağlantı çalışır;
 * statik barındırmada sunucu yönlendirme kuralı gerekmez.
 */
export const ROUTES = {
  profil: 'Profil',
  kesfet: 'Keşfet',
  havuz: 'Havuz',
  kuyruk: 'Onay kuyruğu',
  gecmis: 'Geçmiş',
  ayarlar: 'Ayarlar',
} as const;

export type Route = keyof typeof ROUTES;

export function parseRoute(hash: string): Route {
  const key = hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  return key in ROUTES ? (key as Route) : 'profil';
}

export function href(route: Route): string {
  return `#/${route}`;
}

export function navigate(route: Route): void {
  window.location.hash = `/${route}`;
}

function subscribe(cb: () => void): () => void {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useRoute(): Route {
  return useSyncExternalStore(
    subscribe,
    () => parseRoute(window.location.hash),
    () => 'profil' as Route,
  );
}
