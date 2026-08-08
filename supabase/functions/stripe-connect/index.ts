
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function toStripeParams(obj: unknown, prefix = ""): [string, string][] {
  const pairs: [string, string][] = [];
  if (obj === null || obj === undefined) return pairs;
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => pairs.push(...toStripeParams(item, `${prefix}[${i}]`)));
    return pairs;
  }
  if (typeof obj === "object") {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      pairs.push(...toStripeParams(value, prefix ? `${prefix}[${key}]` : key));
    }
    return pairs;
  }
  pairs.push([prefix, String(obj)]);
  return pairs;
}

async function stripeRequest(method: "GET" | "POST", path: string, body?: Record<string, unknown>) {
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  const opts: RequestInit = {
    method,
    headers: { Authorization: `Bearer ${secretKey}` },
  };
  if (body) {
    opts.headers = { ...opts.headers, "Content-Type": "application/x-www-form-urlencoded" };
    opts.body = new URLSearchParams(toStripeParams(body)).toString();
  }
  const res = await fetch(`https://api.stripe.com/v1/${path}`, opts);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `Stripe API error (${res.status})`);
  return json;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { profileId, returnUrl } = await req.json();
    if (!profileId) throw new Error("profileId is required");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("id, email, stripe_account_id")
      .eq("id", profileId)
      .single();
    if (profileErr) throw new Error(profileErr.message);

    let accountId = profile.stripe_account_id;

    // First time connecting — create a new Express connected account.
    if (!accountId) {
      const account = await stripeRequest("POST", "accounts", {
        type: "express",
        email: profile.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers:     { requested: true },
        },
      });
      accountId = account.id;

      await supabaseAdmin
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", profileId);
    }

    // Account Links expire quickly and are meant to be single-use —
    // create a fresh one every time this function is called, even
    // for a professional who already has an account (e.g. they
    // dropped off mid-onboarding and are retrying).
    const accountLink = await stripeRequest("POST", "account_links", {
      account:     accountId,
      refresh_url: returnUrl,
      return_url:  returnUrl,
      type:        "account_onboarding",
    });

    return new Response(JSON.stringify({ url: accountLink.url }), { headers: CORS });
  } catch (err) {
    console.error("stripe-connect error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
});