import { useId, useRef, useState } from 'react';
import { Button, buttonClass } from '../../components/Button';
import { controlClass, InputField, TextAreaField } from '../../components/InputField';
import {
  ListPane,
  PaneItem,
  Panes,
  PaneTitle,
  ReadingPane,
  revealDetail,
} from '../../components/Panes';
import { InlineError, Notice } from '../../components/States';
import { useToast } from '../../components/Toast';
import { isAbort, userMessage } from '../../lib/errors';
import { href } from '../../lib/router';
import { analyzeCV } from '../../services/geminiService';
import type { CvExtract } from '../../supabase/functions/_shared/schemas';
import type { ApplicantProfile, Tone } from '../../types';
import { useStore } from '../AppStore';
import { CvDropzone } from './CvDropzone';

type SuggestKey = keyof CvExtract;

const LABELS: Record<SuggestKey, string> = {
  fullName: 'Ad soyad',
  university: 'Üniversite',
  department: 'Bölüm',
  grade: 'Sınıf',
  specialty: 'Hedef pozisyon',
  keySkill: 'Öne çıkan beceri',
  startDate: 'Staj tarihleri',
  phone: 'Telefon',
  email: 'E-posta',
  linkedin: 'LinkedIn',
};

const TONES: Record<Tone, string> = {
  formal: 'Resmi',
  confident: 'Özgüvenli',
  enthusiastic: 'İstekli',
};

type SectionKey = 'cv' | 'okul' | 'mail' | 'iletisim';

const SECTIONS: { key: SectionKey; title: string; fields: (keyof ApplicantProfile)[] }[] = [
  { key: 'cv', title: 'Özgeçmiş', fields: [] },
  {
    key: 'okul',
    title: 'Okul ve hedef',
    fields: ['fullName', 'specialty', 'university', 'department', 'grade', 'startDate'],
  },
  { key: 'mail', title: 'Mail içeriği', fields: ['keySkill'] },
  {
    key: 'iletisim',
    title: 'İletişim',
    fields: ['phone', 'email', 'linkedin', 'portfolio', 'cvUrl'],
  },
];

export function ProfilePage() {
  const { profile, updateProfile, cv, setCv, repoKind } = useStore();
  const toast = useToast();
  const [section, setSection] = useState<SectionKey>('cv');
  const [suggestions, setSuggestions] = useState<Partial<CvExtract>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const toneId = useId();

  const pending = (Object.keys(LABELS) as SuggestKey[]).filter(
    (k) => suggestions[k] && suggestions[k] !== profile[k],
  );

  const runAnalysis = async () => {
    if (!cv) return;
    abortRef.current = new AbortController();
    setAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeCV(cv.base64, abortRef.current.signal);
      setSuggestions(result);
      toast.success('Özgeçmiş okundu. Öneriler ilgili alanların altında.');
    } catch (e) {
      if (!isAbort(e)) setError(userMessage(e));
    } finally {
      setAnalyzing(false);
    }
  };

  const accept = (keys: SuggestKey[]) => {
    const patch: Partial<ApplicantProfile> = {};
    for (const k of keys) patch[k] = suggestions[k] ?? '';
    updateProfile(patch);
    setSuggestions((s) => {
      const next = { ...s };
      for (const k of keys) delete next[k];
      return next;
    });
  };

  const field = (key: SuggestKey) => ({
    value: profile[key],
    onChange: (e: { target: { value: string } }) => updateProfile({ [key]: e.target.value }),
    hint:
      suggestions[key] && suggestions[key] !== profile[key] ? (
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span>
            Özgeçmişte: <span className="text-ink">{suggestions[key]}</span>
          </span>
          <button
            type="button"
            onClick={() => accept([key])}
            className="font-medium text-accent-text underline-offset-2 hover:underline"
            aria-label={`${LABELS[key]} önerisini kabul et`}
          >
            Kabul et
          </button>
        </span>
      ) : undefined,
  });

  const complete = Boolean(profile.fullName.trim() && profile.specialty.trim());

  const summary = (key: SectionKey): string => {
    if (key === 'cv') return cv ? cv.name : 'Dosya yüklenmedi';
    if (key === 'mail') return `${TONES[profile.tone]} üslup`;
    const fields = SECTIONS.find((s) => s.key === key)?.fields ?? [];
    const filled = fields.filter((f) => String(profile[f] ?? '').trim()).length;
    return `${filled} / ${fields.length} alan dolu`;
  };

  const suggestionCount = (key: SectionKey) =>
    pending.filter((k) => SECTIONS.find((s) => s.key === key)?.fields.includes(k)).length;

  const current = SECTIONS.find((s) => s.key === section) ?? SECTIONS[0];

  const toolbar = (
    <>
      <p className="mr-auto text-sm text-ink-2">Değişiklikler kendiliğinden kaydedilir.</p>
      {pending.length > 1 && (
        <Button variant="secondary" onClick={() => accept(pending)}>
          {pending.length} öneriyi kabul et
        </Button>
      )}
      {complete && (
        <a href={href('kesfet')} className={buttonClass('primary', 'md')}>
          Şirket keşfine geç
        </a>
      )}
    </>
  );

  return (
    <Panes>
      <ListPane title="Profil">
        <ul aria-label="Profil bölümleri">
          {SECTIONS.map((s) => {
            const count = suggestionCount(s.key);
            return (
              <PaneItem
                key={s.key}
                active={section === s.key}
                onSelect={() => {
                  setSection(s.key);
                  revealDetail();
                }}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <strong className="text-base font-semibold text-ink">{s.title}</strong>
                  {count > 0 && (
                    <span className="tabular shrink-0 text-[0.8125rem] font-medium text-accent-text">
                      {count} öneri
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-sm text-ink-3">{summary(s.key)}</span>
              </PaneItem>
            );
          })}
        </ul>
        <div className="px-4 py-4 split:px-5">
          {complete ? (
            <p className="text-sm text-ink-2">
              Profil taslak yazmaya hazır. Bilgiler her başvuru mailine girer.
            </p>
          ) : (
            <Notice>Taslak yazmak için en az ad soyad ve hedef pozisyonu doldur.</Notice>
          )}
        </div>
      </ListPane>

      <ReadingPane label={current.title} toolbar={toolbar}>
        <div className="flex max-w-[46rem] flex-col gap-6">
          <PaneTitle>{current.title}</PaneTitle>

          {section === 'cv' && (
            <div className="flex flex-col gap-4">
              <p className="max-w-[62ch] text-ink-2">
                {repoKind === 'cloud'
                  ? 'Dosya hesabına özel, yalnız senin erişebildiğin bir alanda saklanır.'
                  : 'Dosya yalnız bu sekmenin belleğinde tutulur; sayfayı yenileyince yeniden yükle.'}{' '}
                Yapay zeka alanları özgeçmişinden önerebilir; her öneriyi sen kabul edersin.
              </p>
              <CvDropzone
                cv={cv}
                onChange={(file) => {
                  setCv(file);
                  setSuggestions({});
                }}
              />
              {error && (
                <InlineError
                  action={
                    <Button variant="secondary" size="sm" onClick={runAnalysis}>
                      Yeniden dene
                    </Button>
                  }
                >
                  {error}
                </InlineError>
              )}
              {cv && (
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={runAnalysis} loading={analyzing} variant="secondary">
                    {analyzing ? 'Özgeçmiş okunuyor' : 'Alanları özgeçmişten öner'}
                  </Button>
                  {analyzing && (
                    <Button variant="ghost" onClick={() => abortRef.current?.abort()}>
                      İptal
                    </Button>
                  )}
                </div>
              )}
              {pending.length > 0 && (
                <p className="text-ink-2">
                  {pending.length} öneri hazır. Öneriler ilgili alanların altında görünür; bölüm
                  listesi her bölümdeki öneri sayısını gösterir.
                </p>
              )}
            </div>
          )}

          {section === 'okul' && (
            <div className="grid gap-5 md:grid-cols-2">
              <InputField label="Ad soyad" required autoComplete="name" {...field('fullName')} />
              <InputField
                label="Hedef pozisyon"
                required
                placeholder="Örnek: Frontend geliştirici"
                {...field('specialty')}
              />
              <InputField label="Üniversite" autoComplete="organization" {...field('university')} />
              <InputField label="Bölüm" {...field('department')} />
              <InputField label="Sınıf" placeholder="Örnek: 3. sınıf" {...field('grade')} />
              <InputField
                label="Staj tarihleri"
                placeholder="Örnek: Şubat – Haziran 2026"
                {...field('startDate')}
              />
            </div>
          )}

          {section === 'mail' && (
            <div className="grid gap-5">
              <p className="max-w-[62ch] text-ink-2">
                Yapay zeka taslağı bu iki bilgiye göre kişiselleştirir.
              </p>
              <TextAreaField
                label="Öne çıkan beceri"
                rows={4}
                placeholder="Örnek: React ile 2.000 kullanıcılı bir etkinlik uygulaması geliştirdim."
                {...field('keySkill')}
                hint={
                  field('keySkill').hint ?? 'Tek cümle yeter. Mailin en dikkat çeken kısmı olur.'
                }
                className="font-serif text-[1.0625rem]"
              />
              <div className="flex flex-col gap-1.5 md:max-w-xs">
                <label htmlFor={toneId} className="text-sm font-medium text-ink">
                  Üslup
                </label>
                <select
                  id={toneId}
                  value={profile.tone}
                  onChange={(e) => updateProfile({ tone: e.target.value as Tone })}
                  className={`${controlClass} h-11`}
                >
                  {(Object.keys(TONES) as Tone[]).map((t) => (
                    <option key={t} value={t}>
                      {TONES[t]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {section === 'iletisim' && (
            <div className="grid gap-5 md:grid-cols-2">
              <p className="text-ink-2 md:col-span-2">Mailin imzasına eklenir.</p>
              <InputField label="Telefon" type="tel" autoComplete="tel" {...field('phone')} />
              <InputField label="E-posta" type="email" autoComplete="email" {...field('email')} />
              <InputField
                label="LinkedIn"
                placeholder="Örnek: linkedin.com/in/kullanici-adi"
                {...field('linkedin')}
              />
              <InputField
                label="Portfolyo"
                type="url"
                placeholder="https://"
                value={profile.portfolio}
                onChange={(e) => updateProfile({ portfolio: e.target.value })}
              />
              <div className="md:col-span-2">
                <InputField
                  label="Özgeçmiş bağlantısı"
                  type="url"
                  placeholder="https://"
                  hint="Dosya eklemezsen bu bağlantı mailde yer alır."
                  value={profile.cvUrl}
                  onChange={(e) => updateProfile({ cvUrl: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      </ReadingPane>
    </Panes>
  );
}
