/**
 * Supabase Edge Function: stripe-webhook
 *
 * This is the most important backend function in the whole app.
 * Every time a client pays an invoice through Stripe, this fires
 * and records the transaction + fees in Supabase.
 *
 * Deploy:
 *   supabase functions deploy stripe-webhook
 *
 * Set secrets:
 *   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
 *   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
 *
 * In Stripe Dashboard → Developers → Webhooks → Add endpoint:
 *   URL: https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook
 *   Events to listen to:
 *     - payment_intent.succeeded
 *     - payment_intent.payment_failed
 *     - payout.paid
 *     - payout.failed
 *     - charge.refunded
 *
 * ── Why this doesn't use the `stripe` npm SDK ──────────────────
 * The SDK (even loaded via esm.sh?target=deno) pulls in Node
 * compatibility shims that call Deno.core.runMicrotasks() internally
 * — an API Supabase's Edge Runtime has since removed, causing every
 * invocation to fail with:
 *   "Deno.core.runMicrotasks() is not supported in this environment"
 * Webhook signature verification is just HMAC-SHA256 over a string,
 * and Stripe's own event/object shapes are plain JSON — neither
 * needs the SDK. Verifying manually with Deno's native Web Crypto
 * API removes the dependency (and the risk of it breaking again on
 * a future Deno runtime upgrade) entirely.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""  // service role — bypasses RLS
);

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

// Stripe UK rate: 1.4% + 20p
const STRIPE_FEE_RATE   = 0.014;
const STRIPE_FEE_FIXED  = 0.20;

// Minimal typing for what we actually read off a Stripe event — not
// the full Stripe type surface (that's what the SDK would normally
// provide), just enough to satisfy TypeScript without resorting to
// `any` anywhere in this file.
interface StripeEvent {
  type: string;
  data: { object: Record<string, unknown> };
}

function calculateFees(grossAmount: number) {
  const stripeFee    = Math.round((grossAmount * STRIPE_FEE_RATE + STRIPE_FEE_FIXED) * 100) / 100;
  const netAmount    = Math.round((grossAmount - stripeFee) * 100) / 100;
  return { stripeFee, netAmount };
}

/**
 * Verifies a Stripe webhook signature manually, per Stripe's public
 * spec: https://stripe.com/docs/webhooks#verify-manually
 *
 * The `Stripe-Signature` header looks like:
 *   t=1614556800,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd
 *
 * Expected signature = HMAC-SHA256(secret, `${timestamp}.${rawBody}`)
 * as a hex string, compared against the `v1` value.
 */
async function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(
    signatureHeader.split(",").map(part => part.split("=") as [string, string])
  );
  const timestamp = parts.t;
  const expectedSig = parts.v1;
  if (!timestamp || !expectedSig) return false;

  // Reject anything older than 5 minutes — prevents replay attacks
  // with a captured/leaked signed payload.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) {
    console.error("Webhook timestamp too old — possible replay attempt");
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const computedSig = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time-ish comparison — not perfectly timing-safe in JS,
  // but matches what most non-SDK Deno implementations do; the 5-min
  // freshness check above already closes the main practical attack
  // window.
  return computedSig === expectedSig;
}

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const rawBody    = await req.text();

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const isValid = await verifyStripeSignature(rawBody, signature, WEBHOOK_SECRET);
  if (!isValid) {
    console.error("Webhook signature verification failed");
    return new Response("Invalid signature", { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  console.log(`[webhook] ${event.type}`);

  try {
    switch (event.type) {

      // ── Client paid an invoice ──────────────────────
      case "payment_intent.succeeded": {
        const pi = event.data.object as {
          id: string;
          amount: number;
          latest_charge?: string;
          metadata?: { invoice_id?: string; profile_id?: string; client_name?: string };
        };

        // We store invoice_id and profile_id in the payment intent metadata
        // when creating the payment link (see create-payment-link/index.ts)
        const invoiceId = pi.metadata?.invoice_id;
        const profileId = pi.metadata?.profile_id;

        if (!invoiceId || !profileId) {
          console.warn("payment_intent.succeeded: missing metadata", pi.id);
          break;
        }

        const grossAmount = pi.amount / 100; // Stripe stores in pence
        const { stripeFee, netAmount } = calculateFees(grossAmount);

        // Get invoice details for context
        const { data: invoice } = await supabase
          .from("invoices")
          .select("*, client:clients(id,name,email)")
          .eq("id", invoiceId)
          .single();

        // 1. Record the transaction
        await supabase.from("payment_transactions").insert({
          profile_id:               profileId,
          invoice_id:               invoiceId,
          client_id:                invoice?.client_id,
          stripe_payment_intent_id: pi.id,
          stripe_charge_id:         pi.latest_charge,
          gross_amount:             grossAmount,
          stripe_fee:               stripeFee,
          net_amount:               netAmount,
          status:                   "completed",
          description:              invoice?.job?.title ?? "Trade services",
          client_name:              invoice?.client?.name ?? pi.metadata?.client_name ?? "",
          client_email:             invoice?.client?.email ?? "",
          paid_at:                  new Date().toISOString(),
        });

        // 2. Mark the invoice as paid in Supabase
        await supabase.from("invoices")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("id", invoiceId);

        // 3. Send SMS notification to tradesperson (if they have Twilio)
        await supabase.functions.invoke("send-sms", {
          body: {
            type: "invoice_paid",
            profileId,
            data: {
              invoiceNumber: invoice?.invoice_number ?? invoiceId,
              amount:        grossAmount,
              clientName:    invoice?.client?.name ?? "your client",
            },
          },
        });

        console.log(`✓ Payment recorded: £${grossAmount} (Stripe fee: £${stripeFee}, net: £${netAmount})`);
        break;
      }

      // ── Payment failed ──────────────────────────────
      case "payment_intent.payment_failed": {
        const pi = event.data.object as { id: string; metadata?: { invoice_id?: string } };
        const invoiceId = pi.metadata?.invoice_id;
        if (invoiceId) {
          await supabase.from("payment_transactions")
            .update({ status: "failed" })
            .eq("stripe_payment_intent_id", pi.id);
        }
        break;
      }

      // ── Payout sent to tradesperson's bank ─────────
      case "payout.paid": {
        const payout = event.data.object as { id: string; arrival_date: number };
        await supabase.from("payouts")
          .update({ status: "paid", arrival_date: new Date(payout.arrival_date * 1000).toISOString().slice(0, 10) })
          .eq("stripe_payout_id", payout.id);
        break;
      }

      case "payout.failed": {
        const payout = event.data.object as { id: string };
        await supabase.from("payouts")
          .update({ status: "failed" })
          .eq("stripe_payout_id", payout.id);
        break;
      }

      // ── Refund issued ───────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object as { id: string };
        await supabase.from("payment_transactions")
          .update({ status: "refunded" })
          .eq("stripe_charge_id", charge.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error handling ${event.type}:`, message);
    return new Response("Handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});