import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useSearchQuery } from '../../components/AppShell';
import { buttonClass } from '../../components/Button';
import {
  ItemHead,
  ListPane,
  PaneItem,
  PanePlaceholder,
  Panes,
  PaneTitle,
  ReadingPane,
  revealDetail,
} from '../../components/Panes';
import { Badge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/States';
import { href } from '../../lib/router';
import { formatDate, matchesQuery } from '../../lib/text';
import type { LogEntry } from '../../types';
import { useStore } from '../AppStore';

function gmailLink(id: string): string {
  return `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(id)}`;
}

function Status({ log }: { log: LogEntry }) {
  return log.status === 'success' ? (
    <Badge tone="ok">Gönderildi</Badge>
  ) : (
    <Badge tone="danger">Gönderilemedi</Badge>
  );
}

const shortDate = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' });

function short(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : shortDate.format(d);
}

function LogDetail({ log }: { log: LogEntry }) {
  const toolbar = log.gmailMessageId ? (
    <a
      href={gmailLink(log.gmailMessageId)}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClass('secondary', 'md')}
    >
      <ExternalLink aria-hidden="true" className="size-4" />
      Gmail’de aç
      <span className="sr-only"> ({log.companyName}, yeni sekmede açılır)</span>
    </a>
  ) : undefined;

  return (
    <ReadingPane label="Gönderim ayrıntısı" toolbar={toolbar}>
      <article className="flex max-w-[46rem] flex-col gap-5">
        <div className="flex flex-col gap-3">
          <PaneTitle>{log.emailSubject || log.companyName}</PaneTitle>
          <div>
            <Status log={log} />
          </div>
        </div>
        <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-t border-line pt-5">
          <dt className="text-ink-3">Şirket</dt>
          <dd className="text-ink">{log.companyName}</dd>
          <dt className="text-ink-3">Kime</dt>
          <dd className="break-words text-ink">{log.recipient || 'Alıcı yok'}</dd>
          <dt className="text-ink-3">Tarih</dt>
          <dd className="tabular text-ink">{formatDate(log.sentAt)}</dd>
          {log.position && (
            <>
              <dt className="text-ink-3">Pozisyon</dt>
              <dd className="text-ink">{log.position}</dd>
            </>
          )}
        </dl>
        {log.error && (
          <p className="rounded-control bg-danger-soft px-4 py-3 text-danger">{log.error}</p>
        )}
        {!log.gmailMessageId && log.status === 'success' && (
          <p className="text-ink-3">Bu kayıt için Gmail ileti bağlantısı yok.</p>
        )}
      </article>
    </ReadingPane>
  );
}

export function HistoryPage() {
  const { logs } = useStore();
  const query = useSearchQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const ok = logs.filter((l) => l.status === 'success').length;
  const visible = logs.filter((l) =>
    matchesQuery(query, l.companyName, l.recipient, l.emailSubject),
  );
  const selected = visible.find((l) => l.id === selectedId) ?? visible[0];

  return (
    <Panes>
      <ListPane title="Geçmiş" count={logs.length}>
        {logs.length === 0 ? (
          <EmptyState
            title="Henüz gönderim yok"
            action={
              <a href={href('kuyruk')} className={buttonClass('primary', 'md')}>
                Onay kuyruğunu aç
              </a>
            }
          >
            Onayladığın her mail burada tarihi ve durumuyla listelenir.
          </EmptyState>
        ) : (
          <>
            <p className="tabular border-b border-line px-4 py-3 text-sm text-ink-2 split:px-5">
              {ok} başvuru gönderildi, {logs.length - ok} deneme başarısız.
            </p>
            {visible.length === 0 ? (
              <p className="px-4 py-8 text-ink-2 split:px-5">“{query}” ile eşleşen kayıt yok.</p>
            ) : (
              <ul aria-label="Gönderim geçmişi">
                {visible.map((l) => (
                  <PaneItem
                    key={l.id}
                    active={selected?.id === l.id}
                    onSelect={() => {
                      setSelectedId(l.id);
                      revealDetail();
                    }}
                  >
                    <ItemHead title={l.companyName} meta={short(l.sentAt)} />
                    <span className="mt-0.5 block truncate text-ink">{l.emailSubject}</span>
                    <span className="block truncate text-sm text-ink-3">
                      {l.recipient || 'Alıcı yok'}
                    </span>
                    <span className="mt-2 flex">
                      <Status log={l} />
                    </span>
                  </PaneItem>
                ))}
              </ul>
            )}
          </>
        )}
      </ListPane>

      {selected ? (
        <LogDetail key={selected.id} log={selected} />
      ) : (
        <ReadingPane label="Gönderim ayrıntısı" wideOnly>
          <PanePlaceholder>
            Bir gönderim seçince alıcısı, tarihi ve durumu burada açılır.
          </PanePlaceholder>
        </ReadingPane>
      )}
    </Panes>
  );
}
