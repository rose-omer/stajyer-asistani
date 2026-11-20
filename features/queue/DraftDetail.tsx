import { useState } from 'react';
import { Mail, Pencil, Send, Undo2 } from 'lucide-react';
import { Button, buttonClass } from '../../components/Button';
import { InputField, TextAreaField } from '../../components/InputField';
import { ResultCard } from '../../components/ResultCard';
import { useToast } from '../../components/Toast';
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
  const { updateCompany, cv } = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [recipient, setRecipient] = useState(c.recipient ?? '');
  const [subject, setSubject] = useState(c.emailDraft?.subject ?? '');
  const [body, setBody] = useState(c.emailDraft?.body ?? '');
  const [errors, setErrors] = useState<{ recipient?: string; subject?: string; body?: string }>({});

  if (!c.emailDraft) return null;
  const sendable = isValidEmail(c.recipient ?? '');

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

  return (
    <section aria-labelledby="draft-title" className="rounded-panel border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <h2 id="draft-title" className="mr-auto text-base font-semibold">
          {c.name}
        </h2>
        {!editing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            icon={<Pencil aria-hidden="true" className="size-4" />}
          >
            Düzenle
          </Button>
        )}
      </div>

      <div className="px-5 py-5">
        {editing ? (
          <div className="flex flex-col gap-5">
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
              rows={14}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              error={errors.body}
              className="font-serif text-[1.0625rem]"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={save}>Kaydet</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setRecipient(c.recipient ?? '');
                  setSubject(c.emailDraft?.subject ?? '');
                  setBody(c.emailDraft?.body ?? '');
                  setErrors({});
                  setEditing(false);
                }}
              >
                Vazgeç
              </Button>
            </div>
          </div>
        ) : (
          <ResultCard email={c.emailDraft} recipient={c.recipient} attachmentName={cv?.name} />
        )}
      </div>

      {!editing && (
        <div className="flex flex-col gap-3 border-t border-line px-5 py-4">
          {c.errorMessage && <p className="text-sm text-danger">{c.errorMessage}</p>}
          {!sendable && (
            <p className="text-sm text-warn">Göndermek için geçerli bir alıcı adresi gir.</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={onSend}
              disabled={Boolean(blocked) || !sendable}
              loading={c.status === 'sending'}
              icon={<Send aria-hidden="true" className="size-4" />}
            >
              Gönder
            </Button>
            <a
              href={mailtoHref(c.recipient ?? '', c.emailDraft.subject, c.emailDraft.body)}
              className={buttonClass('secondary', 'md')}
            >
              <Mail aria-hidden="true" className="size-4" />
              Mail uygulamasında aç
            </a>
            <Button
              variant="ghost"
              onClick={() => {
                updateCompany(c.id, { status: 'analyzed' });
                toast.success(`${c.name} havuza geri alındı.`);
              }}
              icon={<Undo2 aria-hidden="true" className="size-4" />}
            >
              Atla
            </Button>
          </div>
          <p className="text-sm text-ink-3">
            Mail uygulamasında açınca özgeçmiş eki taşınmaz; dosyayı elle ekle.
          </p>
        </div>
      )}
    </section>
  );
}
