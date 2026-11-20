import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button, buttonClass } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageHeader } from '../../components/Page';
import { EmptyState, Notice } from '../../components/States';
import { useToast } from '../../components/Toast';
import { canSendWithGmail, isDemo } from '../../lib/config';
import { userMessage } from '../../lib/errors';
import { href } from '../../lib/router';
import { isValidEmail } from '../../services/mime';
import type { TargetCompany } from '../../types';
import { useStore } from '../AppStore';
import { DraftDetail } from './DraftDetail';

export function sendBlockReason(sentToday: number, limit: number): string | null {
  if (isDemo)
    return 'Demo modunda gönderim kapalı. Taslağı kopyalayabilir ya da mail uygulamanda açabilirsin.';
  if (!canSendWithGmail) return 'Gmail ile gönderim için VITE_GOOGLE_CLIENT_ID tanımlı değil.';
  if (sentToday >= limit) return `Bugünkü gönderim sınırına ulaştınız (${sentToday}/${limit}).`;
  return null;
}

/** Seçimi günlük kalan hakka göre ayırır: ilk `remaining` mail gider, kalanı atlanır. */
export function splitByLimit<T>(items: readonly T[], remaining: number) {
  const n = Math.max(0, remaining);
  return { toSend: items.slice(0, n), skipped: items.slice(n) };
}

export function QueuePage() {
  const { companies, send, sentToday, settings } = useStore();
  const toast = useToast();
  const queue = companies.filter((c) => c.status === 'generated' || c.status === 'sending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<TargetCompany[] | null>(null);
  const [sending, setSending] = useState(false);

  const selected = queue.find((c) => c.id === selectedId) ?? queue[0];
  const blocked = sendBlockReason(sentToday, settings.dailyLimit);
  const remaining = Math.max(0, settings.dailyLimit - sentToday);
  const bulk = queue.filter((c) => checked.has(c.id));

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const { toSend, skipped } = splitByLimit(confirm ?? [], remaining);

  const sendConfirmed = async (items: TargetCompany[]) => {
    setSending(true);
    let ok = 0;
    for (const company of items) {
      try {
        await send(company);
        ok++;
      } catch (e) {
        toast.error(`${company.name}: ${userMessage(e)}`);
        break;
      }
    }
    setSending(false);
    setConfirm(null);
    setChecked(new Set());
    if (ok) toast.success(ok === 1 ? 'Mail gönderildi.' : `${ok} mail gönderildi.`);
  };

  if (queue.length === 0) {
    return (
      <>
        <PageHeader title="Onay kuyruğu" description="Gönderilmeyi bekleyen taslaklar burada." />
        <EmptyState
          title="Onay bekleyen taslak yok"
          action={
            <a href={href('havuz')} className={buttonClass('primary', 'md')}>
              Havuzu aç
            </a>
          }
        >
          Havuzda bir şirketi analiz edip taslak yazdığında burada görünür.
        </EmptyState>
      </>
    );
  }

  const invalidBulk = bulk.filter((c) => !isValidEmail(c.recipient ?? ''));

  return (
    <>
      <PageHeader
        title="Onay kuyruğu"
        description="Her maili oku, gerekirse düzenle. Mail yalnız sen onaylayınca gönderilir."
        actions={
          bulk.length > 0 && !blocked ? (
            <Button
              onClick={() => setConfirm(bulk)}
              disabled={invalidBulk.length > 0}
              icon={<Send aria-hidden="true" className="size-4" />}
            >
              {bulk.length} maili gönder
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-4">
        {blocked ? (
          <Notice tone={isDemo ? 'neutral' : 'warn'}>{blocked}</Notice>
        ) : (
          <p className="tabular text-sm text-ink-2">
            Bugün {sentToday} / {settings.dailyLimit} mail gönderildi. {remaining} gönderim hakkın
            kaldı.
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="rounded-panel border border-line bg-surface lg:sticky lg:top-6 lg:self-start">
            <ul aria-label="Onay bekleyen taslaklar" className="divide-y divide-line">
              {queue.map((c) => {
                const active = selected?.id === c.id;
                return (
                  <li
                    key={c.id}
                    className={`flex items-start gap-3 px-4 py-3 ${active ? 'bg-accent-soft' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(c.id)}
                      onChange={() => toggle(c.id)}
                      aria-label={`${c.name} toplu gönderime ekle`}
                      className="mt-1 size-4 shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      aria-current={active ? 'true' : undefined}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span
                        className={`block truncate ${active ? 'font-semibold text-accent-text' : 'font-medium text-ink'}`}
                      >
                        {c.name}
                      </span>
                      <span className="block truncate text-sm text-ink-3">
                        {c.status === 'sending' ? 'Gönderiliyor' : c.recipient || 'Alıcı yok'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {selected && (
            <DraftDetail
              key={selected.id}
              company={selected}
              blocked={blocked}
              onSend={() => setConfirm([selected])}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={toSend.length > 1 ? `${toSend.length} mail gönderilsin mi?` : 'Mail gönderilsin mi?'}
        confirmLabel={toSend.length > 1 ? `${toSend.length} maili gönder` : 'Gönder'}
        busy={sending}
        confirmDisabled={toSend.length === 0}
        onCancel={() => setConfirm(null)}
        onConfirm={() => sendConfirmed(toSend)}
      >
        <p>Mail kendi Gmail hesabından gönderilir ve geri alınamaz.</p>
        <ul className="mt-3 flex flex-col gap-1">
          {toSend.map((c) => (
            <li key={c.id} className="flex flex-wrap justify-between gap-x-3 text-ink">
              <span className="font-medium">{c.name}</span>
              <span className="break-all text-ink-2">{c.recipient}</span>
            </li>
          ))}
        </ul>
        {skipped.length > 0 && (
          <div className="mt-4 rounded-control bg-warn-soft px-3 py-2">
            <p className="font-medium text-warn">
              Günlük sınır nedeniyle {skipped.length} mail gönderilmez
              {remaining > 0 ? ` (kalan hak: ${remaining})` : ''}. Bunlar kuyrukta kalır; yarın
              gönderebilirsin.
            </p>
            <ul className="mt-1 flex flex-col gap-0.5 text-ink-2">
              {skipped.map((c) => (
                <li key={c.id}>{c.name}</li>
              ))}
            </ul>
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
