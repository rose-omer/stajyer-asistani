import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config, hasSupabase, isDemo } from './config';

/** Tek Supabase istemcisi. Demo modunda ya da yapılandırma yoksa null. */
export const supabase: SupabaseClient | null =
  hasSupabase && !isDemo ? createClient(config.supabaseUrl, config.supabasePublishableKey) : null;
