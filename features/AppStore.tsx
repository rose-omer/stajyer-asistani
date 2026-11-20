import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_DAILY_LIMIT, MAX_DAILY_LIMIT } from '../lib/config';
import { AppError, userMessage } from '../lib/errors';
import { KEYS, readJson, writeJson } from '../lib/storage';
import { isSameLocalDay, newId, normalizeName } from '../lib/text';
import { sendApplication } from '../services/emailService';
import { analyzeCompany, generateEmail } from '../services/geminiService';
import type { Repository } from '../services/repository';
import type {
  AnalysisResult,
  ApplicantProfile,
  AppSettings,
  CvFile,
  GeneratedEmail,
  LogEntry,
  TargetCompany,
} from '../types';
import { useToast } from '../components/Toast';

export const EMPTY_PROFILE: ApplicantProfile = {
  fullName: '',
  university: '',
  department: '',
  grade: '',
  startDate: '',
  specialty: '',
  keySkill: '',
  cvUrl: '',
  tone: 'formal',
  phone: '',
  email: '',
  linkedin: '',
  portfolio: '',
};

function loadSettings(): AppSettings {
  const saved = readJson<Partial<AppSettings>>(KEYS.settings, {});
  const limit = Number(saved.dailyLimit);
  return {
    dailyLimit:
      Number.isFinite(limit) && limit > 0 ? Math.min(limit, MAX_DAILY_LIMIT) : DEFAULT_DAILY_LIMIT,
    theme: saved.theme === 'light' || saved.theme === 'dark' ? saved.theme : 'system',
  };
}

interface Store {
  ready: boolean;
  repoKind: Repository['kind'];
  profile: ApplicantProfile;
  updateProfile: (patch: Partial<ApplicantProfile>) => void;
  cv: CvFile | null;
  setCv: (cv: CvFile | null) => void;
  companies: TargetCompany[];
  logs: LogEntry[];
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  sentToday: number;
  excludedNames: () => string[];
  addCompany: (name: string) => TargetCompany | null;
  updateCompany: (id: string, patch: Partial<TargetCompany>) => void;
  removeCompany: (id: string) => void;
  analyze: (company: TargetCompany, signal?: AbortSignal) => Promise<AnalysisResult>;
  draft: (company: TargetCompany, signal?: AbortSignal) => Promise<GeneratedEmail>;
  send: (company: TargetCompany) => Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const store = use(StoreContext);
  if (!store) throw new Error('useStore yalnız StoreProvider içinde kullanılır.');
  return store;
}

export function StoreProvider({ repo, children }: { repo: Repository; children: ReactNode }) {
  const toast = useToast();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<ApplicantProfile>(EMPTY_PROFILE);
  const [cv, setCvState] = useState<CvFile | null>(null);
  const [companies, setCompanies] = useState<TargetCompany[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const companiesRef = useRef<TargetCompany[]>([]);
  const logsRef = useRef<LogEntry[]>([]);
  const profileLoaded = useRef(false);

  const persist = useCallback(
    (task: Promise<unknown>) => {
      task.catch((error: unknown) => toast.error(`Kayıt başarısız. ${userMessage(error)}`));
    },
    [toast],
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([repo.loadProfile(), repo.listCompanies(), repo.listLogs(), repo.loadCv()])
      .then(([p, c, l, file]) => {
        if (cancelled) return;
        const merged = { ...EMPTY_PROFILE, ...(p ?? {}) };
        setProfile(merged);
        companiesRef.current = c;
        setCompanies(c);
        logsRef.current = l;
        setLogs(l);
        if (file) setCvState({ ...file, name: merged.cvFileName ?? file.name });
      })
      .catch((error: unknown) => toast.error(`Veriler yüklenemedi. ${userMessage(error)}`))
      .finally(() => {
        if (cancelled) return;
        profileLoaded.current = true;
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [repo, toast]);

  // Profil, yazma durunca kaydedilir.
  useEffect(() => {
    if (!profileLoaded.current) return;
    const t = setTimeout(() => persist(repo.saveProfile(profile)), 500);
    return () => clearTimeout(t);
  }, [profile, repo, persist]);

  const commit = useCallback((updater: (list: TargetCompany[]) => TargetCompany[]) => {
    companiesRef.current = updater(companiesRef.current);
    setCompanies(companiesRef.current);
  }, []);

  const updateCompany = useCallback(
    (id: string, patch: Partial<TargetCompany>) => {
      commit((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      const next = companiesRef.current.find((c) => c.id === id);
      if (next) persist(repo.saveCompany(next));
    },
    [commit, persist, repo],
  );

  const addLog = useCallback(
    (entry: LogEntry, companyId?: string) => {
      logsRef.current = [entry, ...logsRef.current];
      setLogs(logsRef.current);
      persist(repo.addLog(entry, companyId));
    },
    [persist, repo],
  );

  const sentToday = logs.filter((l) => l.status === 'success' && isSameLocalDay(l.sentAt)).length;

  const store = useMemo<Store>(() => {
    const sentNames = () =>
      new Set(
        logsRef.current
          .filter((l) => l.status === 'success')
          .map((l) => normalizeName(l.companyName)),
      );

    return {
      ready,
      repoKind: repo.kind,
      profile,
      updateProfile: (patch) => setProfile((p) => ({ ...p, ...patch })),
      cv,
      setCv: (file) => {
        setCvState(file);
        setProfile((p) => ({ ...p, cvFileName: file?.name }));
        persist(repo.saveCv(file));
      },
      companies,
      logs,
      settings,
      updateSettings: (patch) =>
        setSettings((s) => {
          const next = { ...s, ...patch };
          writeJson(KEYS.settings, next);
          return next;
        }),
      sentToday,
      excludedNames: () => [
        ...new Set([
          ...companiesRef.current.map((c) => c.name),
          ...logsRef.current.map((l) => l.companyName),
        ]),
      ],
      addCompany: (name) => {
        const clean = name.replace(/\s+/g, ' ').trim();
        const key = normalizeName(clean);
        if (clean.length < 2) return null;
        if (companiesRef.current.some((c) => normalizeName(c.name) === key)) return null;
        if (sentNames().has(key)) return null;
        const company: TargetCompany = { id: newId(), name: clean, status: 'idle' };
        commit((list) => [...list, company]);
        persist(repo.saveCompany(company));
        return company;
      },
      updateCompany,
      removeCompany: (id) => {
        commit((list) => list.filter((c) => c.id !== id));
        persist(repo.deleteCompany(id));
      },
      analyze: async (company, signal) => {
        updateCompany(company.id, { status: 'analyzing', errorMessage: undefined });
        try {
          const analysis = await analyzeCompany(company.name, signal);
          updateCompany(company.id, {
            status: 'analyzed',
            analysis,
            recipient: analysis.email ?? company.recipient,
          });
          return analysis;
        } catch (error) {
          updateCompany(company.id, {
            status: company.analysis ? 'analyzed' : 'error',
            errorMessage: userMessage(error),
          });
          throw error;
        }
      },
      draft: async (company, signal) => {
        updateCompany(company.id, { status: 'generating', errorMessage: undefined });
        try {
          const emailDraft = await generateEmail(profile, company, Boolean(cv), signal);
          updateCompany(company.id, {
            status: 'generated',
            emailDraft,
            recipient: company.recipient,
          });
          return emailDraft;
        } catch (error) {
          updateCompany(company.id, { status: 'analyzed', errorMessage: userMessage(error) });
          throw error;
        }
      },
      send: async (company) => {
        if (sentToday >= settings.dailyLimit) {
          throw new AppError(
            `Bugünkü gönderim sınırına ulaştınız (${sentToday}/${settings.dailyLimit}).`,
            'QUOTA_REACHED',
          );
        }
        await repo.reserveSend(settings.dailyLimit);
        updateCompany(company.id, { status: 'sending', errorMessage: undefined });
        const base = {
          id: newId(),
          companyName: company.name,
          position: profile.specialty,
          recipient: company.recipient ?? '',
          emailSubject: company.emailDraft?.subject ?? '',
          sentAt: new Date().toISOString(),
        };
        try {
          const gmailMessageId = await sendApplication(company, cv);
          addLog({ ...base, status: 'success', gmailMessageId }, company.id);
          updateCompany(company.id, { status: 'sent', sentAt: base.sentAt });
        } catch (error) {
          const message = userMessage(error);
          addLog({ ...base, status: 'failed', error: message }, company.id);
          updateCompany(company.id, { status: 'generated', errorMessage: message });
          throw error;
        }
      },
    };
  }, [
    ready,
    repo,
    profile,
    cv,
    companies,
    logs,
    settings,
    sentToday,
    commit,
    persist,
    updateCompany,
    addLog,
  ]);

  return <StoreContext value={store}>{children}</StoreContext>;
}
