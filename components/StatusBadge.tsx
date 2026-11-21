import type { CompanyStatus } from '../types';

type Tone = 'neutral' | 'accent' | 'ok' | 'warn' | 'danger';

const TONES: Record<Tone, string> = {
  neutral: 'bg-sunken text-ink-2',
  accent: 'bg-accent-soft text-accent-text',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex min-h-6 items-center gap-1 rounded-full px-2 py-0.5 text-[0.8125rem] leading-tight font-medium whitespace-nowrap ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

const STATUS: Record<CompanyStatus, { label: string; tone: Tone }> = {
  idle: { label: 'Analiz bekliyor', tone: 'neutral' },
  analyzing: { label: 'Analiz ediliyor', tone: 'accent' },
  analyzed: { label: 'Analiz edildi', tone: 'neutral' },
  generating: { label: 'Taslak yazılıyor', tone: 'accent' },
  generated: { label: 'Onay bekliyor', tone: 'accent' },
  sending: { label: 'Gönderiliyor', tone: 'accent' },
  sent: { label: 'Gönderildi', tone: 'ok' },
  error: { label: 'Hata', tone: 'danger' },
};

export function StatusBadge({ status }: { status: CompanyStatus }) {
  const s = STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function EmailBadge({
  verified,
  hasCandidate,
}: {
  verified: boolean;
  hasCandidate: boolean;
}) {
  if (verified) return <Badge tone="ok">İK maili doğrulandı</Badge>;
  return hasCandidate ? (
    <Badge tone="warn">İK maili doğrulanmadı</Badge>
  ) : (
    <Badge tone="danger">İK maili bulunamadı</Badge>
  );
}
