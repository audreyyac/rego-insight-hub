import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://xpednfuiietmhazfzndx.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwZWRuZnVpaWV0bWhhemZ6bmR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDYzNTYsImV4cCI6MjA5MTY4MjM1Nn0.2ye4GYlYrSU_iUhF49ARLvomvEjdDOHdFL4wcFidhhc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const PROFILE_DOCUMENTS_BUCKET = "profile-documents";
export const PROFILE_REPORTS_BUCKET = "profile-reports";
export const N8N_WEBHOOK_URL = "https://marylee-unconsiderable-ocie.ngrok-free.dev/webhook-test/e684a79f-23d3-419c-8d0f-c8abcec6aa94";
export const N8N_REPORT_WEBHOOK_URL = "https://hypotonic-unresponsive-christene.ngrok-free.dev/webhook-test/350eb65a-cfdd-4cfc-aeaf-f41c131a742b";
