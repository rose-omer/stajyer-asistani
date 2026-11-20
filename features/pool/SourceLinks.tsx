import { ExternalLink } from 'lucide-react';
import { hostOf } from '../../lib/text';

/** Kaynak bağlantıları: kullanıcı bilginin nereden geldiğini görür. */
export function SourceLinks({
  sources,
  label = 'Kaynaklar',
}: {
  sources: string[];
  label?: string;
}) {
  if (!sources.length) {
    return <p className="text-sm text-ink-3">Kaynak bağlantısı yok; bilgileri elle doğrula.</p>;
  }
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
      <span className="text-ink-3">{label}:</span>
      {sources.slice(0, 5).map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-accent-text underline decoration-accent-text/40 hover:decoration-accent-text"
        >
          {hostOf(url)}
          <ExternalLink aria-hidden="true" className="size-3" />
          <span className="sr-only"> (yeni sekmede açılır)</span>
        </a>
      ))}
    </div>
  );
}
