import { useId, useRef, useState, type FormEvent } from 'react';
import { Check, Plus, Search } from 'lucide-react';
import { Button, buttonClass } from '../../components/Button';
import { InputField } from '../../components/InputField';
import { ItemHead, ListPane, Panes } from '../../components/Panes';
import { EmptyState, InlineError, SkeletonRows } from '../../components/States';
import { useToast } from '../../components/Toast';
import { isAbort, userMessage } from '../../lib/errors';
import { href } from '../../lib/router';
import { normalizeName } from '../../lib/text';
import { discoverCompanies } from '../../services/geminiService';
import type { DiscoveredCompany } from '../../types';
import { useStore } from '../AppStore';
import { SourceLinks } from '../pool/SourceLinks';
import { AutopilotPanel } from './AutopilotPanel';

const TECHNOPARKS = [
  'ODTÜ Teknokent',
  'Bilkent Cyberpark',
  'Hacettepe Teknokent',
  'Gazi Teknopark',
  'İTÜ Arı Teknokent',
  'Yıldız Teknopark',
  'Teknopark İstanbul',
  'Ege Teknopark',
  'İzmir Teknoloji Geliştirme Bölgesi',
  'ULUTEK',
];

export function DiscoveryPage() {
  const store = useStore();
  const toast = useToast();
  const [city, setCity] = useState('Ankara');
  const [technopark, setTechnopark] = useState('');
  const [cityError, setCityError] = useState<string>();
  const [results, setResults] = useState<DiscoveredCompany[] | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listId = useId();

  const inPool = new Set(store.companies.map((c) => normalizeName(c.name)));
  const sent = new Set(
    store.logs.filter((l) => l.status === 'success').map((l) => normalizeName(l.companyName)),
  );

  const search = async (e?: FormEvent) => {
    e?.preventDefault();
    if (city.trim().length < 2) {
      setCityError('Şehir adını yaz.');
      return;
    }
    setCityError(undefined);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const res = await discoverCompanies(
        city.trim(),
        technopark.trim(),
        store.excludedNames(),
        abortRef.current.signal,
      );
      setResults(res.companies);
      setSources(res.sources);
    } catch (err) {
      if (!isAbort(err)) setError(userMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const add = (name: string) => {
    if (store.addCompany(name)) toast.success(`${name} havuza eklendi.`);
  };

  return (
    <Panes>
      <ListPane title="Şirket keşfi" count={results?.length || undefined}>
        <form
          onSubmit={search}
          noValidate
          className="flex flex-col gap-4 border-b border-line px-4 py-4 split:px-5"
        >
          <p className="text-sm text-ink-2">
            Yapay zeka web aramasıyla staj verebilecek şirketleri listeler. Havuzdaki ve daha önce
            mail attığın şirketler listeye girmez.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 split:grid-cols-1">
            <InputField
              label="Şehir"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              error={cityError}
              autoComplete="address-level2"
            />
            <InputField
              label="Teknokent"
              list={listId}
              placeholder="İsteğe bağlı"
              value={technopark}
              onChange={(e) => setTechnopark(e.target.value)}
            />
          </div>
          <datalist id={listId}>
            {TECHNOPARKS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <Button
            type="submit"
            loading={loading}
            icon={<Search aria-hidden="true" className="size-4" />}
            className="self-start"
          >
            Şirket bul
          </Button>
        </form>

        <section aria-label="Sonuçlar" aria-busy={loading || undefined}>
          {error && (
            <div className="px-4 pt-4 split:px-5">
              <InlineError
                action={
                  <Button variant="secondary" size="sm" onClick={() => search()}>
                    Yeniden dene
                  </Button>
                }
              >
                {error}
              </InlineError>
            </div>
          )}

          {loading ? (
            <SkeletonRows rows={5} label="Şirketler aranıyor" />
          ) : results === null ? (
            !error && (
              <EmptyState title="Henüz arama yapmadın">
                Şehri yaz ve “Şirket bul”a bas. Sonuçlar burada listelenir.
              </EmptyState>
            )
          ) : results.length === 0 ? (
            <EmptyState title="Yeni şirket bulunamadı">
              Başka bir teknokent dene ya da şirketi havuza elle ekle.
            </EmptyState>
          ) : (
            <>
              <ul aria-label="Bulunan şirketler">
                {results.map((c) => {
                  const key = normalizeName(c.name);
                  const added = inPool.has(key);
                  const done = sent.has(key);
                  return (
                    <li
                      key={c.name}
                      className="flex flex-col gap-3 border-b border-line px-4 py-4 split:px-5"
                    >
                      <div className="min-w-0">
                        <ItemHead title={c.name} />
                        <span className="block text-sm text-ink-3">{c.location}</span>
                        {c.brief && <p className="mt-1 text-ink-2">{c.brief}</p>}
                      </div>
                      {done ? (
                        <span className="text-sm text-ink-3">Daha önce başvurdun</span>
                      ) : added ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ok">
                          <Check aria-hidden="true" className="size-4" /> Havuzda
                        </span>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => add(c.name)}
                          icon={<Plus aria-hidden="true" className="size-4" />}
                          aria-label={`${c.name} şirketini havuza ekle`}
                          className="self-start"
                        >
                          Havuza ekle
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="flex flex-col items-start gap-3 px-4 py-4 split:px-5">
                {sources.length > 0 && <SourceLinks sources={sources} label="Arama kaynakları" />}
                {results.some((c) => inPool.has(normalizeName(c.name))) && (
                  <a href={href('havuz')} className={buttonClass('secondary', 'sm')}>
                    Havuza git
                  </a>
                )}
              </div>
            </>
          )}
        </section>
      </ListPane>

      <AutopilotPanel city={city} technopark={technopark} />
    </Panes>
  );
}
