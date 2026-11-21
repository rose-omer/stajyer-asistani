import { isAbort } from '../../lib/errors';
import type { AnalysisResult, DiscoveredCompany, GeneratedEmail, TargetCompany } from '../../types';

/**
 * Toplu taslak: bul → havuza ekle → analiz et → taslak yaz → onay kuyruğuna koy.
 * Bu modül gönderim fonksiyonu almaz; onaysız mail gitmesi yapısal olarak imkânsızdır.
 */
export interface AutopilotDeps {
  discover: (signal: AbortSignal) => Promise<DiscoveredCompany[]>;
  /** Şirket havuzda ya da geçmişte varsa null döner. */
  addCompany: (name: string) => TargetCompany | null;
  analyze: (company: TargetCompany, signal: AbortSignal) => Promise<AnalysisResult>;
  draft: (company: TargetCompany, signal: AbortSignal) => Promise<GeneratedEmail>;
  onProgress: (p: AutopilotProgress) => void;
}

export interface AutopilotProgress {
  done: number;
  total: number;
  current: string;
}

export interface AutopilotSummary {
  drafted: number;
  skipped: number;
  noEmail: number;
  failed: number;
  aborted: boolean;
}

export async function runAutopilot(
  deps: AutopilotDeps,
  signal: AbortSignal,
  limit = 10,
): Promise<AutopilotSummary> {
  const summary: AutopilotSummary = {
    drafted: 0,
    skipped: 0,
    noEmail: 0,
    failed: 0,
    aborted: false,
  };
  try {
    deps.onProgress({ done: 0, total: 0, current: 'Şirketler aranıyor' });
    const found = (await deps.discover(signal)).slice(0, limit);

    for (let i = 0; i < found.length; i++) {
      if (signal.aborted) throw new DOMException('aborted', 'AbortError');
      const item = found[i];
      deps.onProgress({ done: i, total: found.length, current: item.name });

      const company = deps.addCompany(item.name);
      if (!company) {
        summary.skipped++;
        continue;
      }
      try {
        const analysis = await deps.analyze(company, signal);
        if (!analysis.email) {
          // Doğrulanmış adres yok: taslak yazılmaz, kullanıcı havuzda elle karar verir.
          summary.noEmail++;
          continue;
        }
        await deps.draft({ ...company, analysis, recipient: analysis.email }, signal);
        summary.drafted++;
      } catch (error) {
        if (isAbort(error)) throw error;
        summary.failed++;
      }
    }
    deps.onProgress({ done: found.length, total: found.length, current: '' });
  } catch (error) {
    if (!isAbort(error)) throw error;
    summary.aborted = true;
  }
  return summary;
}
