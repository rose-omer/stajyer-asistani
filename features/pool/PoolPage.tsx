import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { Button, buttonClass } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { InputField } from '../../components/InputField';
import { PageHeader, Section } from '../../components/Page';
import { EmptyState } from '../../components/States';
import { useToast } from '../../components/Toast';
import { href } from '../../lib/router';
import { normalizeName } from '../../lib/text';
import type { TargetCompany } from '../../types';
import { useStore } from '../AppStore';
import { PoolItem } from './PoolItem';

export function PoolPage() {
  const { companies, logs, addCompany, removeCompany } = useStore();
  const toast = useToast();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string>();
  const [toDelete, setToDelete] = useState<TargetCompany | null>(null);

  const pool = companies.filter((c) => c.status !== 'sent');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (clean.length < 2) return setNameError('Şirket adını yaz.');
    const key = normalizeName(clean);
    if (companies.some((c) => normalizeName(c.name) === key))
      return setNameError('Bu şirket zaten havuzda.');
    if (logs.some((l) => l.status === 'success' && normalizeName(l.companyName) === key)) {
      return setNameError('Bu şirkete daha önce mail gönderdin.');
    }
    addCompany(clean);
    setName('');
    setNameError(undefined);
    toast.success(`${clean} havuza eklendi.`);
  };

  return (
    <>
      <PageHeader
        title="Havuz"
        description="Şirketleri analiz et, İK adresini doğrula, taslak yaz. Taslaklar onay kuyruğuna geçer."
      />
      <div className="flex flex-col gap-6">
        <Section title="Şirket ekle">
          <form
            onSubmit={submit}
            noValidate
            className="flex flex-col gap-3 sm:flex-row sm:items-start"
          >
            <div className="flex-1">
              <InputField
                label="Şirket adı"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={nameError}
                placeholder="Örnek: Kuzgun Yazılım"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              icon={<Plus aria-hidden="true" className="size-4" />}
              className="sm:mt-[1.625rem]"
            >
              Ekle
            </Button>
          </form>
        </Section>

        <section aria-labelledby="pool-title" className="flex flex-col gap-3">
          <h2 id="pool-title" className="text-base font-semibold">
            Şirketler <span className="tabular font-normal text-ink-3">({pool.length})</span>
          </h2>
          {pool.length === 0 ? (
            <EmptyState
              title="Havuz boş"
              action={
                <a href={href('kesfet')} className={buttonClass('primary', 'md')}>
                  Şirket keşfet
                </a>
              }
            >
              Keşif sayfasından şirket ekle ya da yukarıya bir şirket adı yaz.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line rounded-panel border border-line bg-surface">
              {pool.map((c) => (
                <PoolItem key={c.id} company={c} onDelete={() => setToDelete(c)} />
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Şirket havuzdan silinsin mi?"
        confirmLabel="Sil"
        tone="danger"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            removeCompany(toDelete.id);
            toast.success(`${toDelete.name} silindi.`);
          }
          setToDelete(null);
        }}
      >
        {toDelete?.name} şirketinin analizi ve taslağı silinir. Bu işlem geri alınamaz.
      </ConfirmDialog>
    </>
  );
}
