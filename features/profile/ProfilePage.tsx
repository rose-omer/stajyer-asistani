import { useId, useRef, useState } from 'react';
import { Button, buttonClass } from '../../components/Button';
import { controlClass, InputField, TextAreaField } from '../../components/InputField';
import { PageHeader, Section } from '../../components/Page';
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

export function ProfilePage() {
  const { profile, updateProfile, cv, setCv, repoKind } = useStore();
  const toast = useToast();
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
      toast.success('Özgeçmiş okundu. Önerileri alanların altında görebilirsin.');
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

  return (
    <>
      <PageHeader
        title="Profil"
        description="Bu bilgiler her başvuru mailine girer. Değişiklikler kendiliğinden kaydedilir."
        actions={
          complete ? (
            <a href={href('kesfet')} className={buttonClass('secondary', 'md')}>
              Şirket keşfine geç
            </a>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-6">
        <Section
          title="Özgeçmiş"
          description={
            repoKind === 'cloud'
              ? 'Dosya hesabına özel, yalnız senin erişebildiğin bir alanda saklanır.'
              : 'Dosya yalnız bu sekmenin belleğinde tutulur; sayfayı yenileyince yeniden yükle.'
          }
        >
          <div className="flex flex-col gap-4">
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
                {pending.length > 1 && (
                  <Button variant="ghost" onClick={() => accept(pending)}>
                    {pending.length} öneriyi kabul et
                  </Button>
                )}
              </div>
            )}
          </div>
        </Section>

        <Section title="Okul ve hedef">
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
        </Section>

        <Section
          title="Mail içeriği"
          description="Yapay zeka taslağı bu iki bilgiye göre kişiselleştirir."
        >
          <div className="grid gap-5">
            <TextAreaField
              label="Öne çıkan beceri"
              rows={3}
              placeholder="Örnek: React ile 2.000 kullanıcılı bir etkinlik uygulaması geliştirdim."
              {...field('keySkill')}
              hint={field('keySkill').hint ?? 'Tek cümle yeter. Mailin en dikkat çeken kısmı olur.'}
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
                <option value="formal">Resmi</option>
                <option value="confident">Özgüvenli</option>
                <option value="enthusiastic">İstekli</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="İletişim" description="Mailin imzasına eklenir.">
          <div className="grid gap-5 md:grid-cols-2">
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
        </Section>

        {!complete && <Notice>Taslak yazmak için en az ad soyad ve hedef pozisyonu doldur.</Notice>}
      </div>
    </>
  );
}
