import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LogEntry } from '../types';

let supabase: SupabaseClient | null = null;

export const initSupabase = (url: string, key: string) => {
  if (!url || !key) return;
  try {
    supabase = createClient(url, key);
  } catch (error) {
    console.error("Supabase init error:", error);
  }
};

export const fetchLogs = async (): Promise<LogEntry[]> => {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching logs:", error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id.toString(),
    companyName: item.company_name,
    position: item.position || '',
    sentDate: new Date(item.created_at).toLocaleString('tr-TR'),
    emailSubject: item.email_subject || '',
    status: (item.status === 'success' ? 'success' : 'failed') as 'success' | 'failed'
  }));
};

export const addLog = async (entry: Omit<LogEntry, 'id' | 'sentDate'>): Promise<void> => {
  if (!supabase) return;

  const { error } = await supabase
    .from('applications')
    .insert([
      {
        company_name: entry.companyName,
        position: entry.position,
        email_subject: entry.emailSubject,
        status: entry.status,
        created_at: new Date().toISOString()
      }
    ]);

  if (error) {
    console.error("Error adding log:", error);
    throw new Error("Veritabanına kayıt eklenemedi.");
  }
};

// Check if a company exists in logs (Case insensitive)
export const checkCompanyHistory = async (companyName: string): Promise<boolean> => {
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('applications')
    .select('company_name')
    .ilike('company_name', companyName) // Case insensitive match
    .eq('status', 'success')
    .limit(1);

  if (error) return false;
  return data && data.length > 0;
};