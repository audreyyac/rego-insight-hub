import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xpednfuiietmhazfzndx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_o2k35rRJc7O6C5hf2T9GMg_RLdqeeHO";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export const PROFILE_DOCUMENTS_BUCKET = "profile-documents";
export const N8N_WEBHOOK_URL =
  "https://marylee-unconsiderable-ocie.ngrok-free.dev/webhook/e684a79f-23d3-419c-8d0f-c8abcec6aa94";
