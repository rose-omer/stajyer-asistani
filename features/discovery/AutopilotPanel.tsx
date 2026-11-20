import { CircleStop, PenLine } from 'lucide-react';
import { Button, buttonClass } from '../../components/Button';
import { PaneTitle, ReadingPane } from '../../components/Panes';
import { InlineError, Notice } from '../../components/States';
import { AUTOPILOT_LIMIT } from '../../lib/config';
import { userMessage } from '../../lib/errors';
import { href } from '../../lib/router';
import { useStore } from '../AppStore';
import { useAutopilot } from '../autopilot/useAutopilot';

/** Toplu taslak (okuma bölmesi): hiçbir mail onaysız gitmez; sonuç onay kuyruğuna düşer. */
export function AutopilotPanel({ city, technopark }: { city: string; technopark: string }) {
  const { profile } = useStore();
  const { running, progress, summary, error, start, stop } = useAutopilot();
  const ready = Boolean(
    profile.fullName.trim() && profile.specialty.trim() && city.trim().length >= 2,
  );
  const pct = progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  const toolbar = running ? (
    <Button
      variant="secondary"
      onClick={stop}
      icon={<CircleStop aria-hidden="true" className="size-4" />}
    >
      Durdur
    </Button>
  ) : (
    <Button
      onClick={() => start(city.trim(), technopark.trim())}
      disabled={!ready}
      icon={<PenLine aria-hidden="true" className="size-4" />}
    >
      Toplu taslağı başlat
    </Button>
  );

  return (
    <ReadingPane label="Toplu taslak" toolbar={toolbar}>
      <div className="flex max-w-[46rem] flex-col gap-5">
        <PaneTitle>Toplu taslak</PaneTitle>
        <p className="max-w-[62ch] text-ink-2">
          {`${city.trim() || 'Seçtiğin şehir'}${technopark.trim() ? `, ${technopark.trim()}` : ''} için en çok ${AUTOPILOT_LIMIT} şirket bulur, analiz eder ve taslak yazar. Mailler onay kuyruğunda seni bekler; onayın olmadan hiçbiri gönderilmez.`}
        </p>

        {!ready && !running && (
          <Notice>Başlatmak için profilde ad soyad ve hedef pozisyonu, solda şehri doldur.</Notice>
        )}

        {running && (
          <div className="flex flex-col gap-3 border-y border-line py-5">
            <div
              role="progressbar"
              aria-label="Toplu taslak ilerlemesi"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              className="h-2 overflow-hidden rounded-full bg-line"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p aria-live="polite" className="tabular text-ink-2">
              {progress && progress.total
                ? `${progress.done} / ${progress.total} tamamlandı. Şu an: ${progress.current}`
                : 'Şirketler aranıyor'}
            </p>
          </div>
        )}

        {error !== null && <InlineError>{userMessage(error)}</InlineError>}

        {summary && (
          <div aria-live="polite" className="flex flex-col gap-3 border-y border-line py-5">
            <p className="text-ink">
              {summary.aborted ? 'Durduruldu. ' : ''}
              {summary.drafted} taslak onay kuyruğuna eklendi.
              {summary.noEmail > 0 &&
                ` ${summary.noEmail} şirkette doğrulanmış İK maili yok; havuzda elle karar ver.`}
              {summary.skipped > 0 && ` ${summary.skipped} şirket zaten havuzda ya da geçmişte.`}
              {summary.failed > 0 && ` ${summary.failed} şirket işlenemedi.`}
            </p>
            {summary.drafted > 0 && (
              <a href={href('kuyruk')} className={buttonClass('primary', 'md', 'self-start')}>
                Onay kuyruğunu aç
              </a>
            )}
          </div>
        )}
      </div>
    </ReadingPane>
  );
}
