import { useState } from 'react';
import { Pencil, Search, Trash } from 'lucide-react';
import { Button, buttonClass } from '../../components/Button';
import { InputField } from '../../components/InputField';
import { EmailBadge, StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { isAbort, userMessage } from '../../lib/errors';
import { href } from '../../lib/router';
import { isValidEmail } from '../../services/mime';
import type { TargetCompany } from '../../types';
import { useStore } from '../AppStore';
import { SourceLinks } from './SourceLinks';

export function PoolItem({
  company: c,
  onDelete,
}: {
  company: TargetCompany;
  onDelete: () => void;
}) {
  const { analyze, draft, updateCompany, profile } = useStore();
  const toast = useToast();
  const busy = c.status === 'analyzing' || c.status === 'generating';
  const recipient = c.recipient ?? '';
  const recipientValid = isValidEmail(recipient);
  const profileReady = Boolean(profile.fullName.trim() && profile.specialty.trim());

  const run = async (task: () => Promise<unknown>, done: string) => {
    try {
      await task();
      toast.success(done);
    } catch (e) {
      if (!isAbort(e)) toast.error(`${c.name}: ${userMessage(e)}`);
    }
  };

  const a = c.analysis;
  const recipientHint = !a
    ? undefined
    : a.emailVerified
      ? 'Adres kaynak sayfada görüldü.'
      : a.emailCandidate
        ? `Önerilen ${a.emailCandidate} kaynakta görülmedi. Şirketin sitesinden doğrulayıp yaz.`
        : 'Adres bulunamadı. Şirketin kariyer sayfasından bulup yaz.';

  return (
    <li className="flex flex-col gap-4 px-5 py-5">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <h3 className="mr-auto text-[1.0625rem] font-semibold text-ink">{c.name}</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={c.status} />
          {a && <EmailBadge verified={a.emailVerified} hasCandidate={Boolean(a.emailCandidate)} />}
        </div>
      </div>

      {a && (
        <dl className="grid gap-x-6 gap-y-3 text-[0.9375rem] sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div>
            <dt className="text-sm text-ink-3">Sektör</dt>
            <dd className="text-ink">{a.industry || 'Belirsiz'}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-3">Mailde değinilecek konu</dt>
            <dd className="text-ink">{a.focusTopic || 'Belirsiz'}</dd>
          </div>
        </dl>
      )}

      {a && (
        <div className="max-w-md">
          <RecipientField
            key={`${a.email}|${a.emailCandidate}`}
            initial={recipient}
            hint={recipientHint}
            onCommit={(value) => updateCompany(c.id, { recipient: value })}
          />
        </div>
      )}

      {a && <SourceLinks sources={a.sources} />}

      {c.errorMessage && <p className="text-sm text-danger">{c.errorMessage}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={a ? 'secondary' : 'primary'}
          size="sm"
          loading={c.status === 'analyzing'}
          disabled={busy}
          icon={<Search aria-hidden="true" className="size-4" />}
          onClick={() => run(() => analyze(c), `${c.name} analiz edildi.`)}
        >
          {a ? 'Yeniden analiz et' : 'Analiz et'}
        </Button>
        {a && c.status !== 'generated' && (
          <Button
            size="sm"
            loading={c.status === 'generating'}
            disabled={busy || !recipientValid || !profileReady}
            icon={<Pencil aria-hidden="true" className="size-4" />}
            onClick={() => run(() => draft(c), `${c.name} taslağı onay kuyruğunda.`)}
          >
            Taslak yaz
          </Button>
        )}
        {c.status === 'generated' && (
          <a href={href('kuyruk')} className={buttonClass('primary', 'sm')}>
            Onay kuyruğunda aç
          </a>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          aria-label={`${c.name} şirketini sil`}
          className="ml-auto rounded-control p-2 text-ink-3 transition-colors duration-150 hover:bg-danger-soft hover:text-danger disabled:opacity-50"
        >
          <Trash aria-hidden="true" className="size-4" />
        </button>
      </div>
      {a && !profileReady && (
        <p className="text-sm text-ink-3">
          Taslak için{' '}
          <a href={href('profil')} className="text-accent-text underline">
            profilde
          </a>{' '}
          ad soyad ve hedef pozisyonu doldur.
        </p>
      )}
    </li>
  );
}

/** Alıcı alanı: yazarken yerel durumda tutulur, odaktan çıkınca kaydedilir. */
function RecipientField({
  initial,
  hint,
  onCommit,
}: {
  initial: string;
  hint?: string;
  onCommit: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const invalid = value.trim() !== '' && !isValidEmail(value);
  return (
    <InputField
      label="Alıcı adresi"
      type="email"
      autoComplete="off"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        if (isValidEmail(e.target.value)) onCommit(e.target.value.trim());
      }}
      onBlur={() => {
        if (value.trim() !== initial) onCommit(value.trim());
      }}
      hint={hint}
      error={invalid ? 'Geçerli bir e-posta adresi yaz.' : undefined}
    />
  );
}
