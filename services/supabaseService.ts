import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../lib/errors';
import { normalizeName } from '../lib/text';
import type { AnalysisResult, ApplicantProfile, TargetCompany } from '../types';
import type { Repository } from './repository';

/** Supabase deposu. RLS her satırı oturum sahibine sınırlar. */

interface CompanyRow {
  id: string;
  name: string;
  status: TargetCompany['status'];
  analysis: AnalysisResult | null;
  email_draft: TargetCompany['emailDraft'] | null;
  recipient: string | null;
  error_message: string | null;
}

interface ApplicationRow {
  id: string;
  company_name: string;
  position: string | null;
  recipient: string | null;
  subject: string;
  gmail_message_id: string | null;
  status: 'success' | 'failed';
  error: string | null;
  created_at: string;
}

function check(error: { message: string } | null, what: string): void {
  if (error) throw new Error(`${what}: ${error.message}`);
}

export function createSupabaseRepository(db: SupabaseClient, userId: string): Repository {
  const cvPath = `${userId}/cv.pdf`;

  return {
    kind: 'cloud',

    async loadProfile() {
      const { data, error } = await db.from('profiles').select('data').maybeSingle();
      check(error, 'Profil okunamadı');
      return (data?.data as ApplicantProfile | undefined) ?? null;
    },

    async saveProfile(profile) {
      const { error } = await db
        .from('profiles')
        .upsert({ user_id: userId, data: profile, updated_at: new Date().toISOString() });
      check(error, 'Profil kaydedilemedi');
    },

    async listCompanies() {
      const { data, error } = await db
        .from('companies')
        .select('id,name,status,analysis,email_draft,recipient,error_message')
        .neq('status', 'sent')
        .order('created_at', { ascending: true });
      check(error, 'Şirketler okunamadı');
      return ((data ?? []) as CompanyRow[]).map((r) => ({
        id: r.id,
        name: r.name,
        status: r.status,
        analysis: r.analysis ?? undefined,
        emailDraft: r.email_draft ?? undefined,
        recipient: r.recipient ?? undefined,
        errorMessage: r.error_message ?? undefined,
      }));
    },

    async saveCompany(c) {
      const { error } = await db.from('companies').upsert({
        id: c.id,
        user_id: userId,
        name: c.name,
        name_normalized: normalizeName(c.name),
        status: c.status,
        analysis: c.analysis ?? null,
        email_draft: c.emailDraft ?? null,
        recipient: c.recipient ?? null,
        sources: c.analysis?.sources ?? [],
        error_message: c.errorMessage ?? null,
        updated_at: new Date().toISOString(),
      });
      check(error, 'Şirket kaydedilemedi');
    },

    async deleteCompany(id) {
      const { error } = await db.from('companies').delete().eq('id', id);
      check(error, 'Şirket silinemedi');
    },

    async listLogs() {
      const { data, error } = await db
        .from('applications')
        .select(
          'id,company_name,position,recipient,subject,gmail_message_id,status,error,created_at',
        )
        .order('created_at', { ascending: false })
        .limit(500);
      check(error, 'Geçmiş okunamadı');
      return ((data ?? []) as ApplicationRow[]).map((r) => ({
        id: r.id,
        companyName: r.company_name,
        position: r.position ?? '',
        recipient: r.recipient ?? '',
        emailSubject: r.subject,
        sentAt: r.created_at,
        status: r.status,
        gmailMessageId: r.gmail_message_id ?? undefined,
        error: r.error ?? undefined,
      }));
    },

    async addLog(entry, companyId) {
      const { error } = await db.from('applications').insert({
        id: entry.id,
        user_id: userId,
        company_id: companyId ?? null,
        company_name: entry.companyName,
        company_name_normalized: normalizeName(entry.companyName),
        position: entry.position,
        recipient: entry.recipient,
        subject: entry.emailSubject,
        gmail_message_id: entry.gmailMessageId ?? null,
        status: entry.status,
        error: entry.error ?? null,
        created_at: entry.sentAt,
      });
      check(error, 'Geçmişe yazılamadı');
    },

    async loadCv() {
      const { data, error } = await db.storage.from('cv').download(cvPath);
      if (error || !data) return null;
      const buffer = new Uint8Array(await data.arrayBuffer());
      let binary = '';
      for (let i = 0; i < buffer.length; i += 0x8000) {
        binary += String.fromCharCode(...buffer.subarray(i, i + 0x8000));
      }
      return { name: 'cv.pdf', type: 'application/pdf', size: buffer.length, base64: btoa(binary) };
    },

    async saveCv(cv) {
      if (!cv) {
        const { error } = await db.storage.from('cv').remove([cvPath]);
        check(error, 'CV silinemedi');
        return;
      }
      const bytes = Uint8Array.from(atob(cv.base64), (ch) => ch.charCodeAt(0));
      const { error } = await db.storage
        .from('cv')
        .upload(cvPath, new Blob([bytes], { type: cv.type }), {
          upsert: true,
          contentType: cv.type,
        });
      check(error, 'CV yüklenemedi');
    },

    async reserveSend(limit) {
      const { error } = await db.rpc('reserve_send', { p_limit: limit });
      if (error?.message === 'DAILY_SEND_LIMIT') {
        const detail = 'details' in error && error.details ? ` (${error.details})` : '';
        throw new AppError(`Bugünkü gönderim sınırına ulaştınız${detail}.`, 'QUOTA_REACHED');
      }
      check(error, 'Gönderim sınırı denetlenemedi');
    },
  };
}
