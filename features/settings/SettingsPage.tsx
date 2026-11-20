import { useId, useState } from 'react';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { InputField } from '../../components/InputField';
import {
  ListPane,
  PaneItem,
  Panes,
  PaneTitle,
  ReadingPane,
  revealDetail,
} from '../../components/Panes';
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

type SectionKey = 'gorunum' | 'gonderim' | 'baglantilar' | 'veri';

const SECTIONS: { key: SectionKey; title: string }[] = [
  { key: 'gorunum', title: 'Görünüm' },
  { key: 'gonderim', title: 'Gönderim' },
  { key: 'baglantilar', title: 'Bağlantılar' },
  { key: 'veri', title: 'Veri ve izin' },
];

export function SettingsPage() {
  const { settings, updateSettings, repoKind } = useStore();
  const [section, setSection] = useState<SectionKey>('gorunum');
  const [limit, setLimit] = useState(String(settings.dailyLimit));
  const [confirmReset, setConfirmReset] = useState(false);
  const themeName = useId();

  const n = Number(limit);
  const limitError =
    !Number.isInteger(n) || n < 1 || n > MAX_DAILY_LIMIT
      ? `1 ile ${MAX_DAILY_LIMIT} arasında bir sayı yaz.`
      : undefined;

  const summary: Record<SectionKey, string> = {
    gorunum: `Tema: ${THEMES.find((t) => t.value === settings.theme)?.label ?? 'Sistem'}`,
    gonderim: `Günde en çok ${settings.dailyLimit} mail`,
    baglantilar: isDemo ? 'Demo modu, gönderim kapalı' : 'Gerçek mod',
    veri: repoKind === 'cloud' ? 'Supabase ve bu tarayıcı' : 'Yalnız bu tarayıcı',
  };

  const current = SECTIONS.find((s) => s.key === section) ?? SECTIONS[0];

  return (
    <>
      <Panes>
        <ListPane title="Ayarlar">
          <ul aria-label="Ayar bölümleri">
            {SECTIONS.map((s) => (
              <PaneItem
                key={s.key}
                active={section === s.key}
                onSelect={() => {
                  setSection(s.key);
                  revealDetail();
                }}
              >
                <strong className="block text-base font-semibold text-ink">{s.title}</strong>
                <span className="mt-0.5 block truncate text-sm text-ink-3">{summary[s.key]}</span>
              </PaneItem>
            ))}
          </ul>
        </ListPane>

        <ReadingPane label={current.title}>
          <div className="flex max-w-[46rem] flex-col gap-6">
            <PaneTitle>{current.title}</PaneTitle>

            {section === 'gorunum' && (
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-2 font-medium text-ink">Tema</legend>
                <div className="flex flex-wrap gap-2">
                  {THEMES.map((t) => (
                    <label
                      key={t.value}
                      className="flex h-11 cursor-pointer items-center gap-2 rounded-control border border-line bg-surface px-4 has-checked:border-accent has-checked:bg-accent-soft has-checked:font-semibold has-checked:text-accent-text has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
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
                <p className="text-sm text-ink-3">
                  Sistem, bilgisayarının açık ya da koyu ayarını izler.
                </p>
              </fieldset>
            )}

            {section === 'gonderim' && (
              <div className="flex flex-col gap-4">
                <p className="max-w-[62ch] text-ink-2">
                  Gmail tüketici hesapları günde 100 alıcıyla sınırlıdır. Düşük bir sınır itibarını
                  korur.
                </p>
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
              </div>
            )}

            {section === 'baglantilar' && (
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
                <dt className="text-ink-3">Çalışma modu</dt>
                <dd>
                  {isDemo ? (
                    <Badge tone="warn">Demo: sahte yanıt, gönderim kapalı</Badge>
                  ) : (
                    <Badge tone="ok">Gerçek</Badge>
                  )}
                </dd>
                <dt className="text-ink-3">Veri deposu</dt>
                <dd className="text-ink">
                  {repoKind === 'cloud' ? 'Supabase (hesabına özel)' : 'Bu tarayıcı'}
                </dd>
                <dt className="text-ink-3">Gmail gönderimi</dt>
                <dd className="text-ink">
                  {canSendWithGmail
                    ? 'Açık (gmail.send izni)'
                    : config.googleClientId
                      ? 'Demo modunda kapalı'
                      : 'Kapalı: istemci kimliği tanımlı değil'}
                </dd>
                <dt className="text-ink-3">Yapay zeka modeli</dt>
                <dd className="text-ink">
                  {DEFAULT_GEMINI_MODEL}
                  <span className="block text-sm text-ink-3">
                    Sunucuda GEMINI_MODEL değişkeniyle değişir.
                  </span>
                </dd>
              </dl>
            )}

            {section === 'veri' && (
              <div className="flex flex-col items-start gap-4">
                <p className="max-w-[62ch] text-ink-2">
                  Bu tarayıcıdaki profil, havuz, geçmiş ve tercihleri siler; aydınlatma onayını geri
                  alır.
                  {repoKind === 'cloud' && ' Supabase’deki kayıtların silinmez.'}
                </p>
                <Button variant="secondary" onClick={() => setConfirmReset(true)}>
                  Yerel verileri sil
                </Button>
              </div>
            )}
          </div>
        </ReadingPane>
      </Panes>

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
