import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Basic verification to ensure keys are provided and not standard templates
export const isSupabaseConfigured =
  !!url && url !== "https://your-project-ref.supabase.co" && !!key;

export const supabase = isSupabaseConfigured ? createClient(url!, key!) : null;
