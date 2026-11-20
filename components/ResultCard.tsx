import { useState } from 'react';
import { Check, Copy, Paperclip } from 'lucide-react';
import type { GeneratedEmail } from '../types';
import { Button } from './Button';
import { PaneTitle } from './Panes';

interface ResultCardProps {
  email: GeneratedEmail;
  recipient?: string;
  sender?: string;
  attachmentName?: string;
}

/**
 * Mail önizlemesi: konu başlık olur, zarf bilgisi (Kime, Kimden, Ek) altında durur,
 * gövde bir mektup gibi serif yazıyla dizilir. Kullanıcı gönderilecek metni olduğu gibi okur.
 */
export function ResultCard({ email, recipient, sender, attachmentName }: ResultCardProps) {
  return (
    <article aria-labelledby="draft-title" className="flex max-w-[46rem] flex-col">
      <PaneTitle id="draft-title">{email.subject}</PaneTitle>
      <dl className="mt-5 grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-b border-line pb-5">
        <dt className="text-ink-3">Kime</dt>
        <dd className="break-words text-ink">{recipient || 'Alıcı yok'}</dd>
        {sender && (
          <>
            <dt className="text-ink-3">Kimden</dt>
            <dd className="break-words text-ink">{sender}</dd>
          </>
        )}
        <dt className="text-ink-3">Ek</dt>
        <dd className="flex min-w-0 items-center gap-1.5 text-ink">
          {attachmentName ? (
            <>
              <Paperclip aria-hidden="true" className="size-[0.9375rem] shrink-0 text-ink-2" />
              <span className="truncate">{attachmentName}</span>
            </>
          ) : (
            <span className="text-ink-3">Ek yok</span>
          )}
        </dd>
      </dl>
      <div className="max-w-[44rem] pt-7 font-serif text-[1.0625rem] leading-[1.75] whitespace-pre-wrap text-ink">
        {email.body}
      </div>
    </article>
  );
}

/** Konu ve gövdeyi panoya kopyalar; sonucu ekran okuyucuya bildirir. */
export function CopyTextButton({ email }: { email: GeneratedEmail }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${email.subject}\n\n${email.body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={copy}
      icon={
        copied ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <Copy aria-hidden="true" className="size-4" />
        )
      }
    >
      <span aria-live="polite">{copied ? 'Kopyalandı' : 'Metni kopyala'}</span>
    </Button>
  );
}
