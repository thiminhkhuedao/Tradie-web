
const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

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
          url: `${Deno.env.get("APP_URL") ?? "https://Vimen.app"}/paid?invoice=${invoiceId}`,
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
    console.error("create-payment-link error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
});
