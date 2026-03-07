import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServerKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL).");
}

if (!supabaseAnonKey) {
  throw new Error("Missing SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).");
}

if (!supabaseServerKey) {
  throw new Error("Missing SUPABASE_SECRET_KEY. Use the Supabase API secret key (sb_secret_...).");
}

export const supabaseBrowser = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServerKey,
  {
    auth: { persistSession: false, autoRefreshToken: false }
  }
);
