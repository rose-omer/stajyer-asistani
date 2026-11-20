import { AppShell } from './components/AppShell';
import { SkeletonRows } from './components/States';
import { ToastProvider } from './components/Toast';
import { StoreProvider, useStore } from './features/AppStore';
import { AuthGate, type AuthInfo } from './features/auth/AuthGate';
import { ConsentGate } from './features/auth/ConsentGate';
import { DiscoveryPage } from './features/discovery/DiscoveryPage';
import { HistoryPage } from './features/history/HistoryPage';
import { PoolPage } from './features/pool/PoolPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { QueuePage } from './features/queue/QueuePage';
import { SettingsPage } from './features/settings/SettingsPage';
import { isDemo } from './lib/config';
import { useRoute, type Route } from './lib/router';
import { useApplyTheme } from './lib/theme';

const PAGES: Record<Route, () => React.JSX.Element> = {
  profil: ProfilePage,
  kesfet: DiscoveryPage,
  havuz: PoolPage,
  kuyruk: QueuePage,
  gecmis: HistoryPage,
  ayarlar: SettingsPage,
};

function Shell({ auth }: { auth: AuthInfo }) {
  const route = useRoute();
  const store = useStore();
  useApplyTheme(store.settings.theme);
  const Page = PAGES[route];

  const pool = store.companies.filter((c) => c.status !== 'sent').length;
  const queue = store.companies.filter(
    (c) => c.status === 'generated' || c.status === 'sending',
  ).length;

  return (
    <AppShell
      route={route}
      poolCount={pool}
      queueCount={queue}
      sentToday={store.sentToday}
      dailyLimit={store.settings.dailyLimit}
      modeLabel={isDemo ? 'Demo modu' : 'Staj başvuru asistanı'}
      userEmail={auth.userEmail}
      onSignOut={auth.signOut}
    >
      {store.ready ? <Page /> : <SkeletonRows rows={6} label="Veriler yükleniyor" />}
    </AppShell>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ConsentGate>
        <AuthGate>
          {(auth) => (
            <StoreProvider repo={auth.repo}>
              <Shell auth={auth} />
            </StoreProvider>
          )}
        </AuthGate>
      </ConsentGate>
    </ToastProvider>
  );
}
