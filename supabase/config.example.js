// Copy this file to supabase/config.js and fill in the values from the
// Supabase project (Project Settings → API → Project URL / anon public key).
// Same project as fully-launched-crm — use the same values that repo's
// .env.local has for NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
//
// The anon key is safe to ship in client-side code (it's the public key,
// not a secret) — access control is enforced by the RLS policies in
// supabase/migrations/001_social_os_schema.sql, not by keeping this key
// hidden. supabase/config.js is still gitignored, purely so each
// environment (local/staging/prod) can point at a different project
// without a merge conflict.
//
// Loaded via a plain <script src="…/supabase/config.js"> tag in the
// <head> of all three dashboards (client portal, operator, editor —
// dashboards/template/auth.js reads window.SUPABASE_CONFIG from it to
// build the Supabase client and gate the page behind a real login). Empty
// url/anonKey here means every dashboard just shows "Supabase isn't
// configured" instead of a login form until this is filled in.

window.SUPABASE_CONFIG = {
  url: "",
  anonKey: "",
};
