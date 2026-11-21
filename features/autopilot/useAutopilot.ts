import { useRef, useState } from 'react';
import { AUTOPILOT_LIMIT } from '../../lib/config';
import { discoverCompanies } from '../../services/geminiService';
import { useStore } from '../AppStore';
import { runAutopilot, type AutopilotProgress, type AutopilotSummary } from './autopilot';

/** Toplu taslak işini yönetir. "Durdur" uçuştaki isteği AbortController ile iptal eder. */
export function useAutopilot() {
  const store = useStore();
  const controller = useRef<AbortController | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<AutopilotProgress | null>(null);
  const [summary, setSummary] = useState<AutopilotSummary | null>(null);
  const [error, setError] = useState<unknown>(null);

  const start = async (city: string, technopark: string) => {
    controller.current = new AbortController();
    setRunning(true);
    setSummary(null);
    setError(null);
    try {
      const result = await runAutopilot(
        {
          discover: async (signal) =>
            (await discoverCompanies(city, technopark, store.excludedNames(), signal)).companies,
          addCompany: store.addCompany,
          analyze: store.analyze,
          draft: store.draft,
          onProgress: setProgress,
        },
        controller.current.signal,
        AUTOPILOT_LIMIT,
      );
      setSummary(result);
    } catch (e) {
      setError(e);
    } finally {
      setRunning(false);
      setProgress(null);
      controller.current = null;
    }
  };

  const stop = () => controller.current?.abort();

  return { running, progress, summary, error, start, stop };
}
