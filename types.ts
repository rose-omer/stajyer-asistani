
export interface ApplicantProfile {
  fullName: string;
  university: string;
  department: string;
  grade: string;
  startDate: string;
  specialty: string;
  keySkill: string; // The "Hook" for personalization
  cvNote: string;
  cvFileName?: string; // For UI display
  cvFile?: File | null; // For AI analysis only
  cvFileBase64?: string; // Base64 encoded CV for email attachment
  cvFileType?: string; // MIME type of CV file
  cvUrl?: string; // Link to CV
  tone: 'formal' | 'confident' | 'enthusiastic'; // Email tone
  phone?: string; // Phone number from CV
  email?: string; // Email from CV
  linkedin?: string; // LinkedIn profile from CV
  portfolio?: string; // Portfolio website
}

export interface AppSettings {
  googleScriptUrl: string; // Google Apps Script Web App URL
  supabaseUrl: string;
  supabaseKey: string;
}

export interface AnalysisResult {
  industry: string;
  focusTopic: string;
  contactPerson?: string;
  email?: string; // Found HR email
  sources?: string[];
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export interface TargetCompany {
  id: string;
  name: string;
  status: 'idle' | 'analyzing' | 'analyzed' | 'generating' | 'generated' | 'sending' | 'sent' | 'error';
  analysis?: AnalysisResult; // Data from Module 1
  emailDraft?: GeneratedEmail; // Data from Module 2
  sentDate?: string; // Data from Module 3
  errorMessage?: string;
}

export interface LogEntry {
  id: string; 
  companyName: string;
  position: string;
  sentDate: string;
  emailSubject: string;
  status: 'success' | 'failed';
}

export interface DiscoveredCompany {
  name: string;
  location: string; 
  brief: string;
}
