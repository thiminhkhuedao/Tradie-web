/**
 * Supabase Edge Function: create-payment-link
 * Deploy:   supabase functions deploy create-payment-link
 * Secrets:  STRIPE_SECRET_KEY, APP_URL
 *
 * Calls Stripe's REST API directly via fetch() instead of the
 * `stripe` npm SDK. The SDK (even loaded via esm.sh?target=deno)
 * pulls in Node compatibility shims that call
 * Deno.core.runMicrotasks() internally — an API Supabase's Edge
 * Runtime has since removed, causing every invocation to fail with:
 *   "Deno.core.runMicrotasks() is not supported in this environment"
 * Stripe's API is plain HTTP, so calling it directly with fetch()
 * sidesteps the whole SDK/Deno-compat problem — and is immune to
 * future Deno runtime upgrades breaking this again.
 */

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// Stripe's API expects application/x-www-form-urlencoded with
// bracket notation for nested objects/arrays (e.g.
// `line_items[0][price_data][currency]=gbp`). This flattens a plain
// JS object into that format so we don't have to hand-write every
// field as a string.
function toStripeParams(obj: unknown, prefix = ""): [string, string][] {
  const pairs: [string, string][] = [];

  if (obj === null || obj === undefined) return pairs;

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      pairs.push(...toStripeParams(item, `${prefix}[${i}]`));
    });
    return pairs;
  }

  if (typeof obj === "object") {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const nextPrefix = prefix ? `${prefix}[${key}]` : key;
      pairs.push(...toStripeParams(value, nextPrefix));
    }
    return pairs;
  }

  pairs.push([prefix, String(obj)]);
  return pairs;
}

async function stripeRequest(path: string, body: Record<string, unknown>) {
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  const params = new URLSearchParams(toStripeParams(body));

  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Stripe API error (${res.status})`);
  }
  return json;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { invoiceId, invoiceNumber, profileId, amount, clientEmail, clientName, tradeName, description } = await req.json();
    const amountPence = Math.round(Number(amount) * 100);

    const link = await stripeRequest("payment_links", {
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: description || "Trade services",
              description: `Invoice ${invoiceNumber} from ${tradeName}`,
            },
            unit_amount: amountPence,
          },
          quantity: 1,
        },
      ],
      after_completion: {
        type: "redirect",
        redirect: {
          url: `${Deno.env.get("APP_URL") ?? "https://tradie.app"}/paid?invoice=${invoiceId}`,
        },
      },
      metadata: {
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
        profile_id: profileId ?? "",
        client_name: clientName ?? "",
        client_email: clientEmail ?? "",
      },
    });

    return new Response(JSON.stringify({ url: link.url, id: link.id }), { headers: CORS });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("create-payment-link error:", message);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: CORS });
  }
});
