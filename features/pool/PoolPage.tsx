import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { useSearchQuery } from '../../components/AppShell';
import { Button, buttonClass } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { InputField } from '../../components/InputField';
import {
  ItemHead,
  ListPane,
  PaneItem,
  PanePlaceholder,
  Panes,
  ReadingPane,
  revealDetail,
} from '../../components/Panes';
import { EmailBadge, StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/States';
import { useToast } from '../../components/Toast';
import { href } from '../../lib/router';
import { matchesQuery, normalizeName } from '../../lib/text';
import type { TargetCompany } from '../../types';
import { useStore } from '../AppStore';
import { PoolDetail } from './PoolDetail';

export function PoolPage() {
  const { companies, logs, addCompany, removeCompany } = useStore();
  const toast = useToast();
  const query = useSearchQuery();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<TargetCompany | null>(null);

  const pool = companies.filter((c) => c.status !== 'sent');
  const visible = pool.filter((c) => matchesQuery(query, c.name, c.recipient));
  const selected = visible.find((c) => c.id === selectedId) ?? visible[0];

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
    const added = addCompany(clean);
    if (added) setSelectedId(added.id);
    setName('');
    setNameError(undefined);
    toast.success(`${clean} havuza eklendi.`);
  };

  return (
    <>
      <Panes>
        <ListPane title="Havuz" count={pool.length}>
          <form
            onSubmit={submit}
            noValidate
            className="flex items-start gap-2 border-b border-line px-4 py-4 split:px-5"
          >
            <div className="min-w-0 flex-1">
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
              className="mt-[1.625rem]"
            >
              Ekle
            </Button>
          </form>

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
          ) : visible.length === 0 ? (
            <p className="px-4 py-8 text-ink-2 split:px-5">“{query}” ile eşleşen şirket yok.</p>
          ) : (
            <ul aria-label="Havuzdaki şirketler">
              {visible.map((c) => (
                <PaneItem
                  key={c.id}
                  active={selected?.id === c.id}
                  onSelect={() => {
                    setSelectedId(c.id);
                    revealDetail();
                  }}
                >
                  <ItemHead title={c.name} meta={c.analysis?.industry} />
                  <span className="mt-0.5 block truncate text-sm text-ink-3">
                    {c.recipient || (c.analysis ? 'Alıcı yok' : 'Henüz analiz edilmedi')}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    <StatusBadge status={c.status} />
                    {c.analysis && (
                      <EmailBadge
                        verified={c.analysis.emailVerified}
                        hasCandidate={Boolean(c.analysis.emailCandidate)}
                      />
                    )}
                  </span>
                </PaneItem>
              ))}
            </ul>
          )}
        </ListPane>

        {selected ? (
          <PoolDetail key={selected.id} company={selected} onDelete={() => setToDelete(selected)} />
        ) : (
          <ReadingPane label="Şirket ayrıntısı" wideOnly>
            <PanePlaceholder>
              Havuzdan bir şirket seçince analizi, İK adresi ve kaynakları burada açılır.
            </PanePlaceholder>
          </ReadingPane>
        )}
      </Panes>

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
