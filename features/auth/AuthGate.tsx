import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { BrandHeader } from '../../components/Brand';
import { Button } from '../../components/Button';
import { InlineError } from '../../components/States';
import { userMessage } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { createLocalRepository, type Repository } from '../../services/repository';
import { createSupabaseRepository } from '../../services/supabaseService';

export interface AuthInfo {
  repo: Repository;
  userEmail?: string;
  signOut?: () => void;
}

/** Supabase yapılandırılmışsa Google ile oturum zorunlu; değilse demo deposu kullanılır. */
export function AuthGate({ children }: { children: (auth: AuthInfo) => ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  const repo = useMemo<Repository>(
    () =>
      supabase && userId ? createSupabaseRepository(supabase, userId) : createLocalRepository(),
    [userId],
  );

  if (!supabase) return <>{children({ repo })}</>;
  if (checking) {
    return (
      <div role="status" className="grid min-h-dvh place-items-center text-ink-2">
        Oturum denetleniyor
      </div>
    );
  }
  if (!session) return <SignIn />;
  return (
    <>
      {children({
        repo,
        userEmail: session.user.email,
        signOut: () => void supabase!.auth.signOut(),
      })}
    </>
  );
}

function SignIn() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  const signIn = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
    if (err) {
      setError(userMessage(err));
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
      <BrandHeader />
      <section
        aria-labelledby={titleId}
        className="flex flex-col gap-6 rounded-panel border border-line bg-surface p-6 sm:p-8"
      >
        <div className="flex flex-col gap-2">
          <h1 id={titleId} className="text-2xl font-semibold tracking-[-0.015em]">
            Giriş yap
          </h1>
          <p className="leading-relaxed text-ink-2">
            Staj yapabileceğin şirketleri bul, her biri için başvuru maili hazırla ve yalnız
            onayladığın mailleri kendi Gmail hesabından gönder.
          </p>
        </div>
        {error && <InlineError>{error}</InlineError>}
        <Button onClick={signIn} loading={busy} className="w-full">
          Google ile giriş yap
        </Button>
        <p className="text-sm text-ink-3">
          Giriş, verilerini yalnız senin görebileceğin şekilde saklamak için gerekir.
        </p>
      </section>
    </main>
  );
}
