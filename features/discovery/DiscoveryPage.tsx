import { useId, useRef, useState, type FormEvent } from 'react';
import { Check, Plus, Search } from 'lucide-react';
import { Button, buttonClass } from '../../components/Button';
import { InputField } from '../../components/InputField';
import { PageHeader, Section } from '../../components/Page';
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
    <>
      <PageHeader
        title="Şirket keşfi"
        description="Şehir ya da teknokent seç; yapay zeka web aramasıyla staj verebilecek şirketleri listeler."
      />

      <div className="flex flex-col gap-6">
        <Section title="Arama">
          <form
            onSubmit={search}
            noValidate
            className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-start"
          >
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
            <datalist id={listId}>
              {TECHNOPARKS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <Button
              type="submit"
              loading={loading}
              icon={<Search aria-hidden="true" className="size-4" />}
              className="md:mt-[1.625rem]"
            >
              Şirket bul
            </Button>
          </form>
        </Section>

        <section aria-labelledby="results-title" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="results-title" className="text-base font-semibold">
              Sonuçlar
            </h2>
            {results && results.length > 0 && (
              <span className="tabular text-sm text-ink-3">{results.length} şirket</span>
            )}
          </div>

          {error && (
            <InlineError
              action={
                <Button variant="secondary" size="sm" onClick={() => search()}>
                  Yeniden dene
                </Button>
              }
            >
              {error}
            </InlineError>
          )}

          {loading ? (
            <div className="rounded-panel border border-line bg-surface px-5">
              <SkeletonRows rows={5} label="Şirketler aranıyor" />
            </div>
          ) : results === null ? (
            !error && (
              <EmptyState title="Henüz arama yapmadın">
                Şehri yazıp “Şirket bul”a bas. Havuzdaki ve daha önce mail attığın şirketler listeye
                girmez.
              </EmptyState>
            )
          ) : results.length === 0 ? (
            <EmptyState title="Yeni şirket bulunamadı">
              Başka bir teknokent dene ya da şirketi havuza elle ekle.
            </EmptyState>
          ) : (
            <div className="rounded-panel border border-line bg-surface">
              <ul className="divide-y divide-line">
                {results.map((c) => {
                  const key = normalizeName(c.name);
                  const added = inPool.has(key);
                  const done = sent.has(key);
                  return (
                    <li
                      key={c.name}
                      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink">{c.name}</p>
                        <p className="text-sm text-ink-3">{c.location}</p>
                        {c.brief && (
                          <p className="mt-1 max-w-prose text-[0.9375rem] text-ink-2">{c.brief}</p>
                        )}
                      </div>
                      {done ? (
                        <span className="text-sm text-ink-3">Daha önce başvurdun</span>
                      ) : added ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-ok">
                          <Check aria-hidden="true" className="size-4" /> Havuzda
                        </span>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => add(c.name)}
                          icon={<Plus aria-hidden="true" className="size-4" />}
                          aria-label={`${c.name} şirketini havuza ekle`}
                        >
                          Havuza ekle
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
              {sources.length > 0 && (
                <div className="border-t border-line px-5 py-3">
                  <SourceLinks sources={sources} label="Arama kaynakları" />
                </div>
              )}
            </div>
          )}
          {results && results.some((c) => inPool.has(normalizeName(c.name))) && (
            <a href={href('havuz')} className={buttonClass('ghost', 'sm', 'self-start')}>
              Havuza git
            </a>
          )}
        </section>

        <AutopilotPanel city={city} technopark={technopark} />
      </div>
    </>
  );
}
