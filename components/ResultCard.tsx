import { useState } from 'react';
import { Check, Copy, Paperclip } from 'lucide-react';
import type { GeneratedEmail } from '../types';
import { Button } from './Button';

interface ResultCardProps {
  email: GeneratedEmail;
  recipient?: string;
  attachmentName?: string;
}

/**
 * Mail önizlemesi. Gövde bir mektup gibi serif yazıyla dizilir;
 * kullanıcı gönderilecek metni olduğu gibi okur.
 */
export function ResultCard({ email, recipient, attachmentName }: ResultCardProps) {
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
    <article aria-label="Mail önizlemesi" className="flex flex-col">
      <dl className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1.5 border-b border-line pb-4 text-sm">
        <dt className="text-ink-3">Alıcı</dt>
        <dd className="break-all text-ink">{recipient || 'Belirtilmedi'}</dd>
        <dt className="text-ink-3">Konu</dt>
        <dd className="font-medium text-ink">{email.subject}</dd>
        <dt className="text-ink-3">Ek</dt>
        <dd className="flex items-center gap-1.5 text-ink">
          {attachmentName ? (
            <>
              <Paperclip aria-hidden="true" className="size-3.5 text-ink-3" />
              {attachmentName}
            </>
          ) : (
            <span className="text-ink-3">Ek yok</span>
          )}
        </dd>
      </dl>
      <div className="max-w-[68ch] py-5 font-serif text-[1.0625rem] leading-[1.7] whitespace-pre-wrap text-ink">
        {email.body}
      </div>
      <div>
        <Button
          variant="ghost"
          size="sm"
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
      </div>
    </article>
  );
}
