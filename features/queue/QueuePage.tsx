import { useState } from 'react';
import { Send } from 'lucide-react';
import { useSearchQuery } from '../../components/AppShell';
import { Button, buttonClass } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
  ItemHead,
  ListPane,
  PaneItem,
  PanePlaceholder,
  Panes,
  ReadingPane,
  revealDetail,
} from '../../components/Panes';
import { EmailBadge, Badge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/States';
import { useToast } from '../../components/Toast';
import { canSendWithGmail, isDemo } from '../../lib/config';
import { userMessage } from '../../lib/errors';
import { href } from '../../lib/router';
import { matchesQuery } from '../../lib/text';
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

/** Gövdenin selamlamadan sonraki ilk satırı: listede önizleme olarak görünür. */
function preview(body: string): string {
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  return (lines.length > 1 && lines[0].endsWith(',') ? lines[1] : lines[0]) ?? '';
}

export function QueuePage() {
  const { companies, send, sentToday, settings } = useStore();
  const toast = useToast();
  const query = useSearchQuery();
  const queue = companies.filter((c) => c.status === 'generated' || c.status === 'sending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<TargetCompany[] | null>(null);
  const [sending, setSending] = useState(false);

  const visible = queue.filter((c) => matchesQuery(query, c.name, c.recipient));
  const selected = visible.find((c) => c.id === selectedId) ?? visible[0];
  const blocked = sendBlockReason(sentToday, settings.dailyLimit);
  const remaining = Math.max(0, settings.dailyLimit - sentToday);
  const bulk = queue.filter((c) => checked.has(c.id));
  const allChecked = visible.length > 0 && visible.every((c) => checked.has(c.id));

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setChecked((prev) => {
      const next = new Set(prev);
      for (const c of visible) {
        if (allChecked) next.delete(c.id);
        else next.add(c.id);
      }
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
      <Panes>
        <ListPane title="Onay kuyruğu" count={0}>
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
        </ListPane>
        <ReadingPane label="Taslak önizlemesi" wideOnly>
          <PanePlaceholder>
            Kuyrukta bir taslak seçince mailin tamamı burada açılır.
          </PanePlaceholder>
        </ReadingPane>
      </Panes>
    );
  }

  const invalidBulk = bulk.filter((c) => !isValidEmail(c.recipient ?? ''));

  return (
    <>
      <Panes>
        <ListPane
          title="Onay kuyruğu"
          count={queue.length}
          actions={
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink-2">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                disabled={visible.length === 0}
                className="size-[1.125rem]"
              />
              Tümünü seç
            </label>
          }
        >
          {bulk.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-b border-line bg-accent-soft px-4 py-3 split:px-5">
              <p className="tabular mr-auto font-medium text-accent-text">
                {bulk.length} taslak seçili
              </p>
              {blocked ? (
                <p className="text-sm text-ink-2">Toplu gönderim şu an kapalı.</p>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setConfirm(bulk)}
                  disabled={invalidBulk.length > 0}
                  icon={<Send aria-hidden="true" className="size-4" />}
                >
                  {bulk.length} maili gönder
                </Button>
              )}
              {!blocked && invalidBulk.length > 0 && (
                <p className="basis-full text-sm text-warn">
                  {invalidBulk.length} taslakta geçerli alıcı yok; önce adresi düzelt.
                </p>
              )}
            </div>
          )}

          {visible.length === 0 ? (
            <p className="px-4 py-8 text-ink-2 split:px-5">“{query}” ile eşleşen taslak yok.</p>
          ) : (
            <ul aria-label="Onay bekleyen taslaklar">
              {visible.map((c) => (
                <PaneItem
                  key={c.id}
                  active={selected?.id === c.id}
                  onSelect={() => {
                    setSelectedId(c.id);
                    revealDetail();
                  }}
                  leading={
                    <input
                      type="checkbox"
                      checked={checked.has(c.id)}
                      onChange={() => toggle(c.id)}
                      aria-label={`${c.name} toplu gönderime ekle`}
                      className="mt-1 size-[1.125rem] shrink-0"
                    />
                  }
                >
                  <ItemHead title={c.name} meta={c.analysis?.industry} />
                  <span className="mt-0.5 block truncate text-ink">
                    {c.emailDraft?.subject ?? 'Konu yok'}
                  </span>
                  <span className="block truncate text-sm text-ink-3">
                    {c.recipient || 'Alıcı yok'}
                    {c.emailDraft ? `, ${preview(c.emailDraft.body)}` : ''}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {c.status === 'sending' ? (
                      <Badge tone="accent">Gönderiliyor</Badge>
                    ) : c.analysis ? (
                      <EmailBadge
                        verified={c.analysis.emailVerified}
                        hasCandidate={Boolean(c.analysis.emailCandidate || c.recipient)}
                      />
                    ) : null}
                  </span>
                </PaneItem>
              ))}
            </ul>
          )}
        </ListPane>

        {selected ? (
          <DraftDetail
            key={selected.id}
            company={selected}
            blocked={blocked}
            onSend={() => setConfirm([selected])}
          />
        ) : (
          <ReadingPane label="Taslak önizlemesi" wideOnly>
            <PanePlaceholder>Aramayla eşleşen taslak yok.</PanePlaceholder>
          </ReadingPane>
        )}
      </Panes>

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
