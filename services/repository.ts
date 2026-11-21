import { KEYS, readJson, writeJson } from '../lib/storage';
import type { ApplicantProfile, CvFile, LogEntry, TargetCompany } from '../types';

/**
 * Tek veri kaynağı. Oturum açıksa Supabase, değilse tarayıcı (demo).
 * İki kaynak karıştırılmaz.
 */
export interface Repository {
  kind: 'local' | 'cloud';
  loadProfile(): Promise<ApplicantProfile | null>;
  saveProfile(profile: ApplicantProfile): Promise<void>;
  listCompanies(): Promise<TargetCompany[]>;
  saveCompany(company: TargetCompany): Promise<void>;
  deleteCompany(id: string): Promise<void>;
  listLogs(): Promise<LogEntry[]>;
  addLog(entry: LogEntry, companyId?: string): Promise<void>;
  loadCv(): Promise<CvFile | null>;
  saveCv(cv: CvFile | null): Promise<void>;
  /** Gönderimden önce günlük sınırı denetler. Sınır doluysa QUOTA_REACHED atar. */
  reserveSend(limit: number): Promise<void>;
}

const MAX_LOCAL_LOGS = 200;

/** Tarayıcı deposu. CV yazılmaz; yalnız bellekte kalır. */
export function createLocalRepository(): Repository {
  const companies = () => readJson<TargetCompany[]>(KEYS.companies, []);
  return {
    kind: 'local',
    async loadProfile() {
      return readJson<ApplicantProfile | null>(KEYS.profile, null);
    },
    async saveProfile(profile) {
      writeJson(KEYS.profile, profile);
    },
    async listCompanies() {
      return companies();
    },
    async saveCompany(company) {
      const list = companies();
      const i = list.findIndex((c) => c.id === company.id);
      if (i === -1) list.push(company);
      else list[i] = company;
      writeJson(KEYS.companies, list);
    },
    async deleteCompany(id) {
      writeJson(
        KEYS.companies,
        companies().filter((c) => c.id !== id),
      );
    },
    async listLogs() {
      return readJson<LogEntry[]>(KEYS.logs, []);
    },
    async addLog(entry) {
      const logs = [entry, ...readJson<LogEntry[]>(KEYS.logs, [])].slice(0, MAX_LOCAL_LOGS);
      writeJson(KEYS.logs, logs);
    },
    async loadCv() {
      return null;
    },
    async saveCv() {
      // Bilerek boş: CV kişisel veridir, localStorage'a yazılmaz.
    },
    async reserveSend() {
      // Yerel modda sınırı yalnız istemci denetler (AppStore.send).
    },
  };
}
