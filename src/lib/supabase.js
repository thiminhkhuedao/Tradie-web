// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True once VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are both set. */
export const isSupabaseConfigured = Boolean(url && key);

if (!isSupabaseConfigured) {
  // IMPORTANT: never throw here. 
  console.warn(
    "[Vimen] Supabase env vars are missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).\n" +
    "Running without a real backend: every Supabase call will resolve with an empty/error result " +
    "instead of throwing. Copy .env.example → .env.local and fill in your Supabase project keys " +
    "to enable real data, auth persistence and payments."
  );
}


let clerkGetToken = null;

export function setClerkTokenGetter(fn) {
  clerkGetToken = fn;
}

function createUnconfiguredStub() {
  const notConfiguredError = { message: "Supabase is not configured (demo mode) — see .env.local." };
  const emptyResult = () => Promise.resolve({ data: null, error: notConfiguredError, count: null });

  const chain = {
    select: () => chain, insert: () => chain, update: () => chain, upsert: () => chain,
    delete: () => chain, eq: () => chain, neq: () => chain, in: () => chain,
    order: () => chain, limit: () => chain, range: () => chain,
    single: () => emptyResult(), maybeSingle: () => emptyResult(),
    then: (resolve, reject) => emptyResult().then(resolve, reject),
  };

  return {
    from: () => chain,
    functions: { invoke: () => emptyResult() },
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  };
}

export const supabase = isSupabaseConfigured
  ? createClient(url, key, {
      accessToken: async () => {
        if (!clerkGetToken) return null;
        try {
          return await clerkGetToken();
        } catch (err) {
          console.error("[supabase] failed to get Clerk token:", err);
          return null;
        }
      },
    })
  : createUnconfiguredStub();

// DEBUG ONLY — expose le client dans la console pour pouvoir tester des
// requêtes à la main (ex: vérifier une policy RLS). Jamais en prod : ce
// bloc disparaît entièrement du bundle buildé par Vite en production.
if (import.meta.env.DEV) {
  window.supabase = supabase;
}