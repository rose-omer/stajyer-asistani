import { describe, expect, it } from 'vitest';
import {
  AiRequestSchema,
  CompanyAnalysisOutputSchema,
  CvExtractSchema,
  EmailDraftSchema,
  ModelOutputError,
  parseModelJson,
  toResponseSchema,
} from './schemas';
import { DEFAULT_GEMINI_MODEL, resolveModel } from './model';

const body =
  'Sayın Yetkili,\n\nODTÜ Bilgisayar Mühendisliği öğrencisiyim. Şubat–Haziran 2026 arasında ' +
  'İşletmede Mesleki Eğitim kapsamında ekibinizde staj yapmak istiyorum.\n\nSaygılarımla,\nDeniz Aksoy';

describe('parseModelJson', () => {
  it('geçerli taslağı kabul eder', () => {
    const draft = parseModelJson(
      JSON.stringify({ subject: 'Staj başvurusu', body }),
      EmailDraftSchema,
    );
    expect(draft.subject).toBe('Staj başvurusu');
  });

  it('kod bloğu içindeki JSON metnini ayrıştırır', () => {
    const raw = '```json\n' + JSON.stringify({ subject: 'Staj başvurusu', body }) + '\n```';
    expect(parseModelJson(raw, EmailDraftSchema).body).toContain('Saygılarımla');
  });

  it('bozuk JSON gelince istisna atar (sessiz "Hata oluştu" yok)', () => {
    expect(() => parseModelJson('{"subject": "Başvuru", "body": ', EmailDraftSchema)).toThrow(
      ModelOutputError,
    );
  });

  it('boş yanıtta istisna atar', () => {
    expect(() => parseModelJson('', EmailDraftSchema)).toThrow(ModelOutputError);
  });

  it('kısa gövdeyi reddeder', () => {
    const raw = JSON.stringify({ subject: 'Başvuru', body: 'Hata oluştu.' });
    expect(() => parseModelJson(raw, EmailDraftSchema)).toThrow(ModelOutputError);
  });

  it('doldurulmamış yer tutucuyu reddeder', () => {
    const withPlaceholder = `${body}\nTelefon: [Telefon Numaranız]`;
    const result = EmailDraftSchema.safeParse({ subject: 'Staj başvurusu', body: withPlaceholder });
    expect(result.success).toBe(false);
  });

  it('şirket analizinde geçersiz e-postayı reddeder, null değeri kabul eder', () => {
    const base = { industry: 'Yazılım', focusTopic: 'Web', contactPerson: 'İK' };
    expect(CompanyAnalysisOutputSchema.safeParse({ ...base, email: 'ik-at-firma' }).success).toBe(
      false,
    );
    expect(CompanyAnalysisOutputSchema.safeParse({ ...base, email: null }).success).toBe(true);
  });

  it('CV şemasında eksik alanı reddeder', () => {
    expect(CvExtractSchema.safeParse({ fullName: 'Deniz' }).success).toBe(false);
  });
});

describe('istek şeması', () => {
  it('PDF dışı CV türünü reddeder', () => {
    const r = AiRequestSchema.safeParse({
      action: 'analyze-cv',
      fileBase64: 'QQ==',
      mimeType: 'application/msword',
    });
    expect(r.success).toBe(false);
  });

  it('bilinmeyen eylemi reddeder', () => {
    expect(AiRequestSchema.safeParse({ action: 'send-mail' }).success).toBe(false);
  });
});

describe('toResponseSchema', () => {
  it('Gemini için $schema alanı olmayan JSON Schema üretir', () => {
    const schema = toResponseSchema(EmailDraftSchema);
    expect(schema.$schema).toBeUndefined();
    expect(schema.type).toBe('object');
    expect(Object.keys(schema.properties as object)).toEqual(['subject', 'body']);
  });
});

describe('model adı', () => {
  it('varsayılan gemini-3.5-flash-lite', () => {
    expect(DEFAULT_GEMINI_MODEL).toBe('gemini-3.5-flash-lite');
    expect(resolveModel(undefined)).toBe('gemini-3.5-flash-lite');
    expect(resolveModel('  ')).toBe('gemini-3.5-flash-lite');
  });

  it('ortam değişkeni varsayılanı ezer', () => {
    expect(resolveModel('gemini-4-hydrogen')).toBe('gemini-4-hydrogen');
  });
});
