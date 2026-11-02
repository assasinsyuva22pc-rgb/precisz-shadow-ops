import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://wfueuklszpmuyloodync.supabase.co";
const DEFAULT_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_static_export_pipeline";

const getValidUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.startsWith("http")) {
    return envUrl;
  }
  return DEFAULT_SUPABASE_URL;
};

const getValidKey = () => {
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (envKey && typeof envKey === "string" && envKey.length > 10) {
    return envKey;
  }
  return DEFAULT_ANON_KEY;
};

export const supabase = createClient(getValidUrl(), getValidKey(), {
  auth: {
    persistSession: false,
  },
});