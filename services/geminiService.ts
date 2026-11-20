import { FunctionsHttpError } from '@supabase/supabase-js';
import type { z } from 'zod';
import { isDemo } from '../lib/config';
import { AppError, type ErrorCode } from '../lib/errors';
import { supabase } from '../lib/supabase';
import {
  CompanyAnalysisResponseSchema,
  CvExtractSchema,
  DiscoverResponseSchema,
  EmailDraftSchema,
  type AiRequest,
  type CompanyAnalysisResponse,
  type CvExtract,
  type DiscoverResponse,
  type DraftProfile,
  type EmailDraft,
} from '../supabase/functions/_shared/schemas';
import type { ApplicantProfile, TargetCompany } from '../types';
import { demoAi } from './demoAi';

/**
 * İstemci tarafı AI erişimi. Anahtar yok; her çağrı Supabase Edge Function'a gider.
 * Demo modunda sahte yanıt döner.
 */

const STATUS_CODES: Record<number, ErrorCode> = {
  401: 'UNAUTHORIZED',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
  499: 'ABORTED',
  502: 'UPSTREAM_ERROR',
};

async function invoke<T>(
  request: AiRequest,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  if (isDemo || !supabase) {
    return schema.parse(await demoAi(request, signal));
  }
  const { data, error } = await supabase.functions.invoke('gemini', { body: request, signal });
  if (error) {
    if (signal?.aborted) throw new AppError('İptal edildi.', 'ABORTED');
    if (error instanceof FunctionsHttpError) {
      const status = (error.context as Response | undefined)?.status ?? 500;
      let code: ErrorCode = STATUS_CODES[status] ?? 'INTERNAL_ERROR';
      try {
        const payload = await (error.context as Response).json();
        if (payload?.error?.code === 'MODEL_OUTPUT_INVALID') code = 'MODEL_OUTPUT_INVALID';
      } catch {
        // Gövde okunamazsa durum kodu yeterli.
      }
      throw new AppError(`AI isteği başarısız (${status}).`, code, status);
    }
    throw new AppError('AI servisine ulaşılamadı.', 'NETWORK_ERROR');
  }
  const parsed = schema.safeParse((data as { data?: unknown })?.data);
  if (!parsed.success)
    throw new AppError('Sunucu yanıtı beklenen yapıda değil.', 'MODEL_OUTPUT_INVALID');
  return parsed.data;
}

export function analyzeCV(fileBase64: string, signal?: AbortSignal): Promise<CvExtract> {
  return invoke(
    { action: 'analyze-cv', fileBase64, mimeType: 'application/pdf' },
    CvExtractSchema,
    signal,
  );
}

export function discoverCompanies(
  city: string,
  technopark: string,
  exclude: string[],
  signal?: AbortSignal,
): Promise<DiscoverResponse> {
  return invoke(
    { action: 'discover', city, technopark: technopark || undefined, exclude },
    DiscoverResponseSchema,
    signal,
  );
}

export function analyzeCompany(
  name: string,
  signal?: AbortSignal,
): Promise<CompanyAnalysisResponse> {
  return invoke({ action: 'analyze-company', name }, CompanyAnalysisResponseSchema, signal);
}

export function toDraftProfile(profile: ApplicantProfile, hasAttachment: boolean): DraftProfile {
  return {
    fullName: profile.fullName,
    university: profile.university,
    department: profile.department,
    specialty: profile.specialty,
    keySkill: profile.keySkill,
    startDate: profile.startDate,
    tone: profile.tone,
    phone: profile.phone || undefined,
    email: profile.email || undefined,
    linkedin: profile.linkedin || undefined,
    portfolio: profile.portfolio || undefined,
    cvUrl: profile.cvUrl || undefined,
    hasAttachment,
  };
}

export function generateEmail(
  profile: ApplicantProfile,
  company: TargetCompany,
  hasAttachment: boolean,
  signal?: AbortSignal,
): Promise<EmailDraft> {
  return invoke(
    {
      action: 'draft-email',
      profile: toDraftProfile(profile, hasAttachment),
      company: {
        name: company.name,
        contactPerson: company.analysis?.contactPerson || undefined,
        focusTopic: company.analysis?.focusTopic || undefined,
        industry: company.analysis?.industry || undefined,
      },
    },
    EmailDraftSchema,
    signal,
  );
}
