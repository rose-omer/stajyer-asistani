import { useState } from 'react';
import { Pencil, Search, Trash2 } from 'lucide-react';
import { Button, buttonClass } from '../../components/Button';
import { InputField } from '../../components/InputField';
import { PaneTitle, ReadingPane } from '../../components/Panes';
import { EmailBadge, StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { isAbort, userMessage } from '../../lib/errors';
import { href } from '../../lib/router';
import { isValidEmail } from '../../services/mime';
import type { TargetCompany } from '../../types';
import { useStore } from '../AppStore';
import { SourceLinks } from './SourceLinks';

/** Havuzdaki şirketin okuma bölmesi: analiz, alıcı adresi, kaynaklar ve sonraki adım. */
export function PoolDetail({
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

  const toolbar = (
    <>
      <Button
        variant={a ? 'secondary' : 'primary'}
        loading={c.status === 'analyzing'}
        disabled={busy}
        icon={<Search aria-hidden="true" className="size-4" />}
        onClick={() => run(() => analyze(c), `${c.name} analiz edildi.`)}
      >
        {a ? 'Yeniden analiz et' : 'Analiz et'}
      </Button>
      {a && c.status !== 'generated' && (
        <Button
          loading={c.status === 'generating'}
          disabled={busy || !recipientValid || !profileReady}
          icon={<Pencil aria-hidden="true" className="size-4" />}
          onClick={() => run(() => draft(c), `${c.name} taslağı onay kuyruğunda.`)}
        >
          Taslak yaz
        </Button>
      )}
      {c.status === 'generated' && (
        <a href={href('kuyruk')} className={buttonClass('primary', 'md')}>
          Onay kuyruğunda aç
        </a>
      )}
      <Button
        variant="ghost"
        className="ml-auto"
        onClick={onDelete}
        disabled={busy}
        aria-label={`${c.name} şirketini sil`}
        icon={<Trash2 aria-hidden="true" className="size-4" />}
      >
        Sil
      </Button>
    </>
  );

  return (
    <ReadingPane label="Şirket ayrıntısı" toolbar={toolbar}>
      <div className="flex max-w-[46rem] flex-col gap-6">
        <div className="flex flex-col gap-3">
          <PaneTitle>{c.name}</PaneTitle>
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge status={c.status} />
            {a && (
              <EmailBadge verified={a.emailVerified} hasCandidate={Boolean(a.emailCandidate)} />
            )}
          </div>
        </div>

        {a ? (
          <dl className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-x-4 gap-y-2 border-y border-line py-5">
            <dt className="text-ink-3">Sektör</dt>
            <dd className="text-ink">{a.industry || 'Belirsiz'}</dd>
            <dt className="text-ink-3">Mailde değinilecek konu</dt>
            <dd className="text-ink">{a.focusTopic || 'Belirsiz'}</dd>
            {a.contactPerson && (
              <>
                <dt className="text-ink-3">İlgili kişi</dt>
                <dd className="text-ink">{a.contactPerson}</dd>
              </>
            )}
          </dl>
        ) : (
          <p className="max-w-[60ch] text-ink-2">
            Analiz, şirketin ne yaptığını ve İK adresini kaynak sayfalardan bulur. Taslak yazmadan
            önce analiz et.
          </p>
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

        {c.errorMessage && <p className="font-medium text-danger">{c.errorMessage}</p>}

        {a && !profileReady && (
          <p className="text-ink-2">
            Taslak için{' '}
            <a href={href('profil')} className="font-medium text-accent-text underline">
              profilde
            </a>{' '}
            ad soyad ve hedef pozisyonu doldur.
          </p>
        )}
      </div>
    </ReadingPane>
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
