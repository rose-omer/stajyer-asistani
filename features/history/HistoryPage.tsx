import { ExternalLink } from 'lucide-react';
import { buttonClass } from '../../components/Button';
import { PageHeader } from '../../components/Page';
import { Badge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/States';
import { href } from '../../lib/router';
import { formatDate } from '../../lib/text';
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

function GmailLink({ log }: { log: LogEntry }) {
  if (!log.gmailMessageId) return <span className="text-ink-3">–</span>;
  return (
    <a
      href={gmailLink(log.gmailMessageId)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-accent-text underline decoration-accent-text/40 hover:decoration-accent-text"
    >
      Gmail’de aç
      <ExternalLink aria-hidden="true" className="size-3" />
      <span className="sr-only"> ({log.companyName}, yeni sekmede açılır)</span>
    </a>
  );
}

export function HistoryPage() {
  const { logs } = useStore();
  const ok = logs.filter((l) => l.status === 'success').length;

  return (
    <>
      <PageHeader
        title="Geçmiş"
        description={
          logs.length
            ? `${ok} başvuru gönderildi, ${logs.length - ok} deneme başarısız.`
            : undefined
        }
      />
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
          {/* Masaüstü: tablo */}
          <div className="hidden overflow-hidden rounded-panel border border-line bg-surface md:block">
            <table className="w-full text-left text-[0.9375rem]">
              <caption className="sr-only">Gönderim geçmişi</caption>
              <thead className="border-b border-line bg-sunken text-sm text-ink-2">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Tarih
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Şirket
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Alıcı
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Durum
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    <span className="sr-only">Bağlantı</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {logs.map((l) => (
                  <tr key={l.id} className="align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-ink-2">
                      {formatDate(l.sentAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink">{l.companyName}</span>
                      <span className="block text-sm text-ink-3">{l.emailSubject}</span>
                      {l.error && <span className="block text-sm text-danger">{l.error}</span>}
                    </td>
                    <td className="px-4 py-3 break-all text-ink-2">{l.recipient || '–'}</td>
                    <td className="px-4 py-3">
                      <Status log={l} />
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <GmailLink log={l} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobil: liste */}
          <ul className="divide-y divide-line rounded-panel border border-line bg-surface md:hidden">
            {logs.map((l) => (
              <li key={l.id} className="flex flex-col gap-1.5 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-medium text-ink">{l.companyName}</span>
                  <Status log={l} />
                </div>
                <span className="text-sm text-ink-2">{l.emailSubject}</span>
                <span className="tabular text-sm text-ink-3">
                  {formatDate(l.sentAt)}
                  {l.recipient && <span className="break-all">, {l.recipient}</span>}
                </span>
                {l.error && <span className="text-sm text-danger">{l.error}</span>}
                <span className="text-sm">
                  <GmailLink log={l} />
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
