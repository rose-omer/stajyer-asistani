import type { z } from 'zod';
import {
  CompanyAnalysisOutputSchema,
  CvExtractSchema,
  DiscoveryOutputSchema,
  EmailDraftSchema,
  parseModelJson,
  toResponseSchema,
  type AiRequest,
  type CompanyAnalysisResponse,
  type CvExtract,
  type DiscoverResponse,
  type EmailDraft,
} from './schemas.ts';
import {
  CV_PROMPT,
  SYSTEM_BASE,
  companySearchPrompt,
  discoverySearchPrompt,
  draftPrompt,
  structurePrompt,
} from './prompts.ts';
import { htmlToText, verifyEmailInSources } from './verifyEmail.ts';

export type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

export interface GenerateInput {
  system: string;
  parts: Part[];
  /** Verilirse yapılandırılmış JSON çıktı istenir. */
  jsonSchema?: Record<string, unknown>;
  /** Google Search grounding açılır (şema ile birlikte kullanılmaz). */
  search?: boolean;
}

export interface GenerateOutput {
  text: string;
  sources: string[];
}

export type GenerateFn = (input: GenerateInput) => Promise<GenerateOutput>;
export type FetchPageFn = (url: string) => Promise<{ url: string; body: string }>;

const MAX_SOURCE_PAGES = 5;

export function createHandlers(generate: GenerateFn, fetchPage: FetchPageFn) {
  async function analyzeCv(fileBase64: string, mimeType: string): Promise<CvExtract> {
    const out = await generate({
      system: SYSTEM_BASE,
      parts: [{ inlineData: { mimeType, data: fileBase64 } }, { text: CV_PROMPT }],
      jsonSchema: toResponseSchema(CvExtractSchema),
    });
    return parseModelJson(out.text, CvExtractSchema);
  }

  /**
   * İki adım: 1) arama ile düz metin + kaynaklar, 2) araçsız şemaya dönüştürme.
   * Yapılandırılmış çıktı + arama aracı birleşimi henüz önizleme durumunda.
   */
  async function searchThenStructure<T>(prompt: string, schema: z.ZodType<T>) {
    const research = await generate({
      system: SYSTEM_BASE,
      parts: [{ text: prompt }],
      search: true,
    });
    const structured = await generate({
      system: SYSTEM_BASE,
      parts: [{ text: structurePrompt(research.text) }],
      jsonSchema: toResponseSchema(schema),
    });
    return { data: parseModelJson(structured.text, schema), sources: research.sources };
  }

  async function discover(
    city: string,
    technopark: string | undefined,
    exclude: string[],
  ): Promise<DiscoverResponse> {
    const { data, sources } = await searchThenStructure(
      discoverySearchPrompt(city, technopark, exclude),
      DiscoveryOutputSchema,
    );
    const key = (n: string) => n.toLocaleLowerCase('tr-TR').trim();
    const excluded = new Set(exclude.map(key));
    const companies = data.companies.filter((c) => !excluded.has(key(c.name)));
    return { companies, sources };
  }

  async function analyzeCompany(name: string): Promise<CompanyAnalysisResponse> {
    const { data, sources } = await searchThenStructure(
      companySearchPrompt(name),
      CompanyAnalysisOutputSchema,
    );
    let email: string | null = null;
    if (data.email) {
      const pages = await Promise.all(
        sources
          .slice(0, MAX_SOURCE_PAGES)
          .map((url) => fetchPage(url).catch(() => ({ url, body: '' }))),
      );
      email = verifyEmailInSources(
        data.email,
        pages.map((p) => ({ url: p.url, text: htmlToText(p.body) })),
      );
    }
    return {
      industry: data.industry,
      focusTopic: data.focusTopic,
      contactPerson: data.contactPerson,
      email,
      emailCandidate: email ? null : data.email,
      emailVerified: email !== null,
      sources,
    };
  }

  async function draftEmail(
    req: Extract<AiRequest, { action: 'draft-email' }>,
  ): Promise<EmailDraft> {
    const out = await generate({
      system: SYSTEM_BASE,
      parts: [{ text: draftPrompt(req.profile, req.company) }],
      jsonSchema: toResponseSchema(EmailDraftSchema),
    });
    return parseModelJson(out.text, EmailDraftSchema);
  }

  return async function handle(req: AiRequest): Promise<unknown> {
    switch (req.action) {
      case 'analyze-cv':
        return analyzeCv(req.fileBase64, req.mimeType);
      case 'discover':
        return discover(req.city, req.technopark, req.exclude);
      case 'analyze-company':
        return analyzeCompany(req.name);
      case 'draft-email':
        return draftEmail(req);
    }
  };
}
