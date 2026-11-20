import { useId, useState } from 'react';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { InputField } from '../../components/InputField';
import { PageHeader, Section } from '../../components/Page';
import { Badge } from '../../components/StatusBadge';
import { canSendWithGmail, config, isDemo, MAX_DAILY_LIMIT } from '../../lib/config';
import { KEYS, writeString } from '../../lib/storage';
import { DEFAULT_GEMINI_MODEL } from '../../supabase/functions/_shared/model';
import type { ThemePreference } from '../../types';
import { useStore } from '../AppStore';
import { revokeConsent } from '../auth/ConsentGate';

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistem' },
  { value: 'light', label: 'Açık' },
  { value: 'dark', label: 'Koyu' },
];

export function SettingsPage() {
  const { settings, updateSettings, repoKind } = useStore();
  const [limit, setLimit] = useState(String(settings.dailyLimit));
  const [confirmReset, setConfirmReset] = useState(false);
  const themeName = useId();

  const n = Number(limit);
  const limitError =
    !Number.isInteger(n) || n < 1 || n > MAX_DAILY_LIMIT
      ? `1 ile ${MAX_DAILY_LIMIT} arasında bir sayı yaz.`
      : undefined;

  return (
    <>
      <PageHeader title="Ayarlar" />
      <div className="flex flex-col gap-6">
        <Section title="Görünüm">
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-sm font-medium text-ink">Tema</legend>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((t) => (
                <label
                  key={t.value}
                  className="flex h-10 cursor-pointer items-center gap-2 rounded-control border border-line-strong/50 px-3 text-[0.9375rem] has-checked:border-accent has-checked:bg-accent-soft has-checked:text-accent-text has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
                >
                  <input
                    type="radio"
                    name={themeName}
                    value={t.value}
                    checked={settings.theme === t.value}
                    onChange={() => updateSettings({ theme: t.value })}
                    className="sr-only"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>
        </Section>

        <Section
          title="Gönderim"
          description="Gmail tüketici hesapları günde 100 alıcıyla sınırlıdır. Düşük bir sınır itibarını korur."
        >
          <div className="max-w-xs">
            <InputField
              label="Günlük gönderim sınırı"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_DAILY_LIMIT}
              value={limit}
              onChange={(e) => {
                setLimit(e.target.value);
                const v = Number(e.target.value);
                if (Number.isInteger(v) && v >= 1 && v <= MAX_DAILY_LIMIT)
                  updateSettings({ dailyLimit: v });
              }}
              error={limitError}
              hint={`En çok ${MAX_DAILY_LIMIT}.`}
            />
          </div>
        </Section>

        <Section title="Bağlantılar">
          <dl className="grid gap-x-6 gap-y-4 text-[0.9375rem] sm:grid-cols-[12rem_1fr]">
            <dt className="text-ink-2">Çalışma modu</dt>
            <dd>
              {isDemo ? (
                <Badge tone="warn">Demo: sahte yanıt, gönderim kapalı</Badge>
              ) : (
                <Badge tone="ok">Gerçek</Badge>
              )}
            </dd>
            <dt className="text-ink-2">Veri deposu</dt>
            <dd className="text-ink">
              {repoKind === 'cloud' ? 'Supabase (hesabına özel)' : 'Bu tarayıcı'}
            </dd>
            <dt className="text-ink-2">Gmail gönderimi</dt>
            <dd className="text-ink">
              {canSendWithGmail
                ? 'Açık (gmail.send izni)'
                : config.googleClientId
                  ? 'Demo modunda kapalı'
                  : 'Kapalı: istemci kimliği tanımlı değil'}
            </dd>
            <dt className="text-ink-2">Yapay zeka modeli</dt>
            <dd className="text-ink">
              {DEFAULT_GEMINI_MODEL}
              <span className="block text-sm text-ink-3">
                Sunucuda GEMINI_MODEL değişkeniyle değişir.
              </span>
            </dd>
          </dl>
        </Section>

        <Section title="Veri ve izin">
          <div className="flex flex-col items-start gap-3">
            <p className="max-w-prose text-[0.9375rem] text-ink-2">
              Bu tarayıcıdaki profil, havuz, geçmiş ve tercihleri siler; aydınlatma onayını geri
              alır.
              {repoKind === 'cloud' && ' Supabase’deki kayıtların silinmez.'}
            </p>
            <Button variant="secondary" onClick={() => setConfirmReset(true)}>
              Yerel verileri sil
            </Button>
          </div>
        </Section>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Yerel veriler silinsin mi?"
        confirmLabel="Verileri sil"
        tone="danger"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          for (const key of Object.values(KEYS)) writeString(key, null);
          revokeConsent();
          window.location.reload();
        }}
      >
        Bu işlem geri alınamaz. Sayfa yeniden yüklenir.
      </ConfirmDialog>
    </>
  );
}
