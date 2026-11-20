// Her değişken tek tek okunur: Vite yalnız adı geçen VITE_* değerlerini pakete gömer.
// `import.meta.env` nesnesini bütün olarak kullanma; tanımlı her VITE_* değeri sızar.
export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() ?? '',
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? '',
  demoFlag: import.meta.env.VITE_DEMO === '1',
};

export const hasSupabase = Boolean(config.supabaseUrl && config.supabasePublishableKey);

/** Demo: Supabase yoksa ya da VITE_DEMO=1 ise. Sahte AI yanıtı, gönderim kapalı. */
export const isDemo = config.demoFlag || !hasSupabase;

/** Gmail ile gönderim yalnız gerçek modda ve istemci kimliği varsa açık. */
export const canSendWithGmail = !isDemo && Boolean(config.googleClientId);

export const MAX_CV_BYTES = 5 * 1024 * 1024;
export const DEFAULT_DAILY_LIMIT = 10;
export const MAX_DAILY_LIMIT = 20;
export const AUTOPILOT_LIMIT = 10;
