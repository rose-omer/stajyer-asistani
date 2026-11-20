import { useState } from 'react';
import { Mail, Pencil, Send, Undo2 } from 'lucide-react';
import { Button, buttonClass } from '../../components/Button';
import { InputField, TextAreaField } from '../../components/InputField';
import { PaneTitle, ReadingPane } from '../../components/Panes';
import { CopyTextButton, ResultCard } from '../../components/ResultCard';
import { useToast } from '../../components/Toast';
import { hostOf } from '../../lib/text';
import { mailtoHref } from '../../services/emailService';
import { isValidEmail } from '../../services/mime';
import { EmailDraftSchema } from '../../supabase/functions/_shared/schemas';
import type { TargetCompany } from '../../types';
import { useStore } from '../AppStore';

interface DraftDetailProps {
  company: TargetCompany;
  blocked: string | null;
  onSend: () => void;
}

export function DraftDetail({ company: c, blocked, onSend }: DraftDetailProps) {
  const { updateCompany, cv, profile } = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [recipient, setRecipient] = useState(c.recipient ?? '');
  const [subject, setSubject] = useState(c.emailDraft?.subject ?? '');
  const [body, setBody] = useState(c.emailDraft?.body ?? '');
  const [errors, setErrors] = useState<{ recipient?: string; subject?: string; body?: string }>({});

  if (!c.emailDraft) return null;
  const draft = c.emailDraft;
  const sendable = isValidEmail(c.recipient ?? '');
  const source =
    c.analysis?.emailVerified && c.analysis.sources[0]
      ? ` Adres kaynak sayfada görüldü: ${hostOf(c.analysis.sources[0])}`
      : '';

  const save = () => {
    const next: typeof errors = {};
    if (!isValidEmail(recipient)) next.recipient = 'Geçerli bir e-posta adresi yaz.';
    const parsed = EmailDraftSchema.safeParse({ subject, body });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as 'subject' | 'body';
        next[key] ??= issue.message;
      }
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    updateCompany(c.id, {
      recipient: recipient.trim(),
      emailDraft: { subject: subject.trim(), body: body.trim() },
    });
    setEditing(false);
    toast.success('Taslak kaydedildi.');
  };

  const cancel = () => {
    setRecipient(c.recipient ?? '');
    setSubject(draft.subject);
    setBody(draft.body);
    setErrors({});
    setEditing(false);
  };

  const skip = (
    <Button
      variant="ghost"
      className="ml-auto"
      onClick={() => {
        updateCompany(c.id, { status: 'analyzed' });
        toast.success(`${c.name} havuza geri alındı.`);
      }}
      icon={<Undo2 aria-hidden="true" className="size-4" />}
    >
      Atla, havuza geri al
    </Button>
  );

  const toolbar = editing ? (
    skip
  ) : (
    <>
      <Button
        variant="secondary"
        onClick={() => setEditing(true)}
        icon={<Pencil aria-hidden="true" className="size-4" />}
      >
        Düzenle
      </Button>
      <CopyTextButton email={draft} />
      <a
        href={mailtoHref(c.recipient ?? '', draft.subject, draft.body)}
        className={buttonClass('secondary', 'md')}
      >
        <Mail aria-hidden="true" className="size-4" />
        Mail uygulamasında aç
      </a>
      {skip}
    </>
  );

  const footer = editing ? undefined : (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex min-w-0 flex-[1_1_20rem] flex-col gap-0.5">
        <p className="font-semibold text-ink">Mail yalnız sen onaylayınca gönderilir.</p>
        <p className="text-sm text-ink-2">
          {blocked ?? `Kendi Gmail hesabından gider ve geri alınamaz.${source}`}
        </p>
        {!sendable && (
          <p className="text-sm font-medium text-warn">
            Göndermek için geçerli bir alıcı adresi gir.
          </p>
        )}
        {c.errorMessage && <p className="text-sm font-medium text-danger">{c.errorMessage}</p>}
      </div>
      <Button
        size="lg"
        onClick={onSend}
        disabled={Boolean(blocked) || !sendable}
        loading={c.status === 'sending'}
        icon={<Send aria-hidden="true" className="size-[1.125rem]" />}
      >
        Onayla ve gönder
      </Button>
    </div>
  );

  return (
    <ReadingPane label="Taslak önizlemesi" toolbar={toolbar} footer={footer}>
      {editing ? (
        <div className="flex max-w-[46rem] flex-col gap-5">
          <PaneTitle id="draft-title">{c.name} taslağını düzenle</PaneTitle>
          <InputField
            label="Alıcı"
            type="email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            error={errors.recipient}
          />
          <InputField
            label="Konu"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            error={errors.subject}
          />
          <TextAreaField
            label="Mail metni"
            rows={16}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            error={errors.body}
            className="font-serif text-[1.0625rem] leading-[1.75]"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={save}>Kaydet</Button>
            <Button variant="ghost" onClick={cancel}>
              Vazgeç
            </Button>
          </div>
        </div>
      ) : (
        <>
          <ResultCard
            email={draft}
            recipient={c.recipient}
            sender={profile.email.trim() ? `${profile.email.trim()} (Gmail)` : undefined}
            attachmentName={cv?.name}
          />
          {cv && (
            <p className="mt-8 max-w-[44rem] text-sm text-ink-3">
              Mail uygulamasında açınca özgeçmiş eki taşınmaz; dosyayı elle ekle.
            </p>
          )}
        </>
      )}
    </ReadingPane>
  );
}
