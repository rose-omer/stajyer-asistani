export type Tone = 'formal' | 'confident' | 'enthusiastic';

export interface ApplicantProfile {
  fullName: string;
  university: string;
  department: string;
  grade: string;
  startDate: string;
  specialty: string;
  /** Mailin kişiselleştirme cümlesi. */
  keySkill: string;
  cvUrl: string;
  tone: Tone;
  phone: string;
  email: string;
  linkedin: string;
  portfolio: string;
  /** Yüklenen CV'nin özgün adı (dosyanın kendisi profile yazılmaz). */
  cvFileName?: string;
}

/** CV dosyası yalnız bellekte (ya da oturum açıksa Supabase Storage'da) tutulur. */
export interface CvFile {
  name: string;
  type: 'application/pdf';
  size: number;
  base64: string;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppSettings {
  /** Günlük gönderim üst sınırı. */
  dailyLimit: number;
  theme: ThemePreference;
}

export interface AnalysisResult {
  industry: string;
  focusTopic: string;
  contactPerson: string;
  /** Kaynak sayfada doğrulanmış İK adresi; doğrulanmadıysa null. */
  email: string | null;
  /** Modelin önerdiği ama kaynakta görülmeyen adres. */
  emailCandidate: string | null;
  emailVerified: boolean;
  sources: string[];
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export type CompanyStatus =
  'idle' | 'analyzing' | 'analyzed' | 'generating' | 'generated' | 'sending' | 'sent' | 'error';

export interface TargetCompany {
  id: string;
  name: string;
  status: CompanyStatus;
  analysis?: AnalysisResult;
  emailDraft?: GeneratedEmail;
  /** Kullanıcının onayladığı alıcı adresi. */
  recipient?: string;
  sentAt?: string;
  errorMessage?: string;
}

export interface LogEntry {
  id: string;
  companyName: string;
  position: string;
  recipient: string;
  emailSubject: string;
  /** ISO tarih. */
  sentAt: string;
  status: 'success' | 'failed';
  gmailMessageId?: string;
  error?: string;
}

export interface DiscoveredCompany {
  name: string;
  location: string;
  brief: string;
}
