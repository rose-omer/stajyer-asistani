import { CircleStop } from 'lucide-react';
import { Button, buttonClass } from '../../components/Button';
import { Section } from '../../components/Page';
import { InlineError, Notice } from '../../components/States';
import { AUTOPILOT_LIMIT } from '../../lib/config';
import { userMessage } from '../../lib/errors';
import { href } from '../../lib/router';
import { useStore } from '../AppStore';
import { useAutopilot } from '../autopilot/useAutopilot';

/** Toplu taslak: hiçbir mail onaysız gitmez; sonuç onay kuyruğuna düşer. */
export function AutopilotPanel({ city, technopark }: { city: string; technopark: string }) {
  const { profile } = useStore();
  const { running, progress, summary, error, start, stop } = useAutopilot();
  const ready = Boolean(
    profile.fullName.trim() && profile.specialty.trim() && city.trim().length >= 2,
  );
  const pct = progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <Section
      title="Toplu taslak"
      description={`En çok ${AUTOPILOT_LIMIT} şirket bulur, analiz eder ve taslak yazar. Mailler onay kuyruğunda seni bekler; onayın olmadan hiçbiri gönderilmez.`}
    >
      <div className="flex flex-col gap-4">
        {!ready && !running && (
          <Notice>
            Başlatmak için profilde ad soyad ve hedef pozisyonu, yukarıda şehri doldur.
          </Notice>
        )}

        {running ? (
          <div className="flex flex-col gap-3">
            <div
              role="progressbar"
              aria-label="Toplu taslak ilerlemesi"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              className="h-1.5 overflow-hidden rounded-full bg-sunken"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p aria-live="polite" className="tabular text-[0.9375rem] text-ink-2">
              {progress && progress.total
                ? `${progress.done} / ${progress.total} tamamlandı. Şu an: ${progress.current}`
                : 'Şirketler aranıyor'}
            </p>
            <Button
              variant="secondary"
              onClick={stop}
              icon={<CircleStop aria-hidden="true" className="size-4" />}
              className="self-start"
            >
              Durdur
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => start(city.trim(), technopark.trim())}
            disabled={!ready}
            className="self-start"
          >
            Toplu taslağı başlat
          </Button>
        )}

        {error !== null && <InlineError>{userMessage(error)}</InlineError>}

        {summary && (
          <div
            aria-live="polite"
            className="flex flex-col gap-3 rounded-panel bg-sunken px-4 py-3 text-[0.9375rem]"
          >
            <p className="text-ink">
              {summary.aborted ? 'Durduruldu. ' : ''}
              {summary.drafted} taslak onay kuyruğuna eklendi.
              {summary.noEmail > 0 &&
                ` ${summary.noEmail} şirkette doğrulanmış İK maili yok; havuzda elle karar ver.`}
              {summary.skipped > 0 && ` ${summary.skipped} şirket zaten havuzda ya da geçmişte.`}
              {summary.failed > 0 && ` ${summary.failed} şirket işlenemedi.`}
            </p>
            {summary.drafted > 0 && (
              <a href={href('kuyruk')} className={buttonClass('primary', 'sm', 'self-start')}>
                Onay kuyruğunu aç
              </a>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}
