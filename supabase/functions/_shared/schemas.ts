import { z } from 'zod';

/** Model çıktısı şemaya uymazsa atılır. Sessiz "Hata oluştu" metni dönmez. */
export class ModelOutputError extends Error {
  constructor(
    message: string,
    public readonly issues?: unknown,
  ) {
    super(message);
    this.name = 'ModelOutputError';
  }
}

const text = (max: number) => z.string().trim().max(max);

export const CvExtractSchema = z.object({
  fullName: text(120),
  university: text(160),
  department: text(160),
  grade: text(40),
  specialty: text(120),
  keySkill: text(200),
  startDate: text(80),
  phone: text(40),
  email: text(160),
  linkedin: text(200),
});
export type CvExtract = z.infer<typeof CvExtractSchema>;

export const DiscoveredCompanySchema = z.object({
  name: text(160).min(2),
  location: text(160),
  brief: text(400),
});

export const DiscoveryOutputSchema = z.object({
  companies: z.array(DiscoveredCompanySchema).max(15),
});
export type DiscoveryOutput = z.infer<typeof DiscoveryOutputSchema>;

export const CompanyAnalysisOutputSchema = z.object({
  industry: text(120),
  focusTopic: text(300),
  contactPerson: text(120),
  email: z.email().nullable(),
});
export type CompanyAnalysisOutput = z.infer<typeof CompanyAnalysisOutputSchema>;

const PLACEHOLDER = /\[[^\]\n]{2,40}\]/;

export const EmailDraftSchema = z.object({
  subject: text(160).min(5, 'Konu çok kısa.'),
  body: z
    .string()
    .trim()
    .min(120, 'Mail gövdesi çok kısa.')
    .max(6000)
    .refine((b) => !PLACEHOLDER.test(b), 'Gövdede doldurulmamış yer tutucu var.'),
});
export type EmailDraft = z.infer<typeof EmailDraftSchema>;

/** Gemini'ye `responseJsonSchema` olarak verilecek JSON Schema. */
export function toResponseSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { target: 'draft-7' }) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

/** Model metnini JSON olarak ayrıştırır ve şemayla doğrular. Hata durumunda atar. */
export function parseModelJson<T>(raw: string | undefined | null, schema: z.ZodType<T>): T {
  if (!raw || !raw.trim()) throw new ModelOutputError('Model boş yanıt döndü.');
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  let data: unknown;
  try {
    data = JSON.parse(cleaned);
  } catch {
    throw new ModelOutputError('Model yanıtı geçerli JSON değil.');
  }
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ModelOutputError('Model yanıtı beklenen yapıda değil.', result.error.issues);
  }
  return result.data;
}

/* İstek gövdeleri (sunucu girişte doğrular). */
const MAX_CV_BASE64 = Math.ceil((5 * 1024 * 1024 * 4) / 3) + 8;

export const AnalyzeCvRequest = z.object({
  action: z.literal('analyze-cv'),
  fileBase64: z.string().min(1).max(MAX_CV_BASE64),
  mimeType: z.literal('application/pdf'),
});

export const DiscoverRequest = z.object({
  action: z.literal('discover'),
  city: text(60).min(2),
  technopark: text(120).optional(),
  exclude: z.array(text(160)).max(300).default([]),
});

export const AnalyzeCompanyRequest = z.object({
  action: z.literal('analyze-company'),
  name: text(160).min(2),
});

export const DraftProfileSchema = z.object({
  fullName: text(120).min(2),
  university: text(160),
  department: text(160),
  specialty: text(120).min(2),
  keySkill: text(300),
  startDate: text(80),
  tone: z.enum(['formal', 'confident', 'enthusiastic']),
  phone: text(40).optional(),
  email: text(160).optional(),
  linkedin: text(200).optional(),
  portfolio: text(200).optional(),
  hasAttachment: z.boolean(),
  cvUrl: text(300).optional(),
});
export type DraftProfile = z.infer<typeof DraftProfileSchema>;

export const DraftEmailRequest = z.object({
  action: z.literal('draft-email'),
  profile: DraftProfileSchema,
  company: z.object({
    name: text(160).min(2),
    contactPerson: text(120).optional(),
    focusTopic: text(300).optional(),
    industry: text(120).optional(),
  }),
});

export const AiRequestSchema = z.discriminatedUnion('action', [
  AnalyzeCvRequest,
  DiscoverRequest,
  AnalyzeCompanyRequest,
  DraftEmailRequest,
]);
export type AiRequest = z.infer<typeof AiRequestSchema>;
export type AiAction = AiRequest['action'];

/* Yanıtlar (istemci de doğrular). */
export const DiscoverResponseSchema = z.object({
  companies: z.array(DiscoveredCompanySchema),
  sources: z.array(z.string()),
});
export type DiscoverResponse = z.infer<typeof DiscoverResponseSchema>;

export const CompanyAnalysisResponseSchema = z.object({
  industry: z.string(),
  focusTopic: z.string(),
  contactPerson: z.string(),
  email: z.string().nullable(),
  emailCandidate: z.string().nullable(),
  emailVerified: z.boolean(),
  sources: z.array(z.string()),
});
export type CompanyAnalysisResponse = z.infer<typeof CompanyAnalysisResponseSchema>;
