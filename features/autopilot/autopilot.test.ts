import { describe, expect, it, vi } from 'vitest';
import type { AnalysisResult, TargetCompany } from '../../types';
import { runAutopilot, type AutopilotDeps } from './autopilot';

const analysis = (email: string | null): AnalysisResult => ({
  industry: 'Yazılım',
  focusTopic: 'Web',
  contactPerson: 'İK',
  email,
  emailCandidate: null,
  emailVerified: email !== null,
  sources: [],
});

function makeDeps(overrides: Partial<AutopilotDeps> = {}) {
  const send = vi.fn();
  const deps: AutopilotDeps = {
    discover: vi.fn(async () => [
      { name: 'Kuzgun', location: 'Ankara', brief: '' },
      { name: 'Ardıç', location: 'Ankara', brief: '' },
      { name: 'Selvi', location: 'Ankara', brief: '' },
    ]),
    addCompany: vi.fn((name: string): TargetCompany => ({ id: name, name, status: 'idle' })),
    analyze: vi.fn(async (c: TargetCompany) =>
      analysis(c.name === 'Selvi' ? null : `ik@${c.id}.example`),
    ),
    draft: vi.fn(async () => ({ subject: 'Konu', body: 'Gövde' })),
    onProgress: vi.fn(),
    ...overrides,
  };
  return { deps, send };
}

describe('runAutopilot', () => {
  it('taslak üretir ama hiçbir yol gönderim çağırmaz', async () => {
    const { deps, send } = makeDeps();
    const summary = await runAutopilot(
      { ...deps, ...{ send } } as AutopilotDeps,
      new AbortController().signal,
    );
    expect(summary).toMatchObject({ drafted: 2, noEmail: 1, failed: 0, aborted: false });
    expect(deps.draft).toHaveBeenCalledTimes(2);
    expect(send).not.toHaveBeenCalled();
  });

  it('doğrulanmış adresi taslağa alıcı olarak geçirir', async () => {
    const { deps } = makeDeps();
    await runAutopilot(deps, new AbortController().signal);
    expect(vi.mocked(deps.draft).mock.calls[0][0].recipient).toBe('ik@Kuzgun.example');
  });

  it('havuzda olan şirketi atlar', async () => {
    const { deps } = makeDeps({ addCompany: vi.fn(() => null) });
    const summary = await runAutopilot(deps, new AbortController().signal);
    expect(summary.skipped).toBe(3);
    expect(deps.analyze).not.toHaveBeenCalled();
  });

  it('"Durdur" uçuştaki isteği iptal eder ve döngüyü bitirir', async () => {
    const controller = new AbortController();
    const analyze = vi.fn(
      (_c: TargetCompany, signal: AbortSignal) =>
        new Promise<AnalysisResult>((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
          controller.abort();
        }),
    );
    const { deps } = makeDeps({ analyze });
    const summary = await runAutopilot(deps, controller.signal);
    expect(summary.aborted).toBe(true);
    expect(analyze).toHaveBeenCalledTimes(1);
    expect(deps.draft).not.toHaveBeenCalled();
  });

  it('tek şirketteki hata işi durdurmaz', async () => {
    const { deps } = makeDeps({
      analyze: vi.fn(async (c: TargetCompany) => {
        if (c.name === 'Kuzgun') throw new Error('ağ hatası');
        return analysis('ik@ok.example');
      }),
    });
    const summary = await runAutopilot(deps, new AbortController().signal);
    expect(summary).toMatchObject({ failed: 1, drafted: 2 });
  });

  it('üst sınırdan fazla şirket işlemez', async () => {
    const { deps } = makeDeps();
    await runAutopilot(deps, new AbortController().signal, 1);
    expect(deps.addCompany).toHaveBeenCalledTimes(1);
  });
});
