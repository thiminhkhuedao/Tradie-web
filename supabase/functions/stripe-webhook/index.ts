
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""  // service role — bypasses RLS
);

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

// Platform fee rate: 2%
const PLATFORM_FEE_RATE = 0.02;
// Stripe UK rate: 1.4% + 20p
const STRIPE_FEE_RATE   = 0.014;
const STRIPE_FEE_FIXED  = 0.20;

function calculateFees(grossAmount: number) {
  const stripeFee    = Math.round((grossAmount * STRIPE_FEE_RATE + STRIPE_FEE_FIXED) * 100) / 100;
  const platformFee  = Math.round(grossAmount * PLATFORM_FEE_RATE * 100) / 100;
  const netAmount    = Math.round((grossAmount - stripeFee - platformFee) * 100) / 100;
  return { stripeFee, platformFee, netAmount };
}


async function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(
    signatureHeader.split(",").map(part => part.split("=") as [string, string])
  );
  const timestamp = parts.t;
  const expectedSig = parts.v1;
  if (!timestamp || !expectedSig) return false;

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

  let event: any;
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
        const pi = event.data.object;

        const invoiceId = pi.metadata?.invoice_id;
        const profileId = pi.metadata?.profile_id;

        if (!invoiceId || !profileId) {
          console.warn("payment_intent.succeeded: missing metadata", pi.id);
          break;
        }

        const grossAmount = pi.amount / 100; // Stripe stores in pence
        const { stripeFee, platformFee, netAmount } = calculateFees(grossAmount);

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
          platform_fee:             platformFee,
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

        console.log(`✓ Payment recorded: £${grossAmount} (platform fee: £${platformFee})`);
        break;
      }

      // ── Payment failed ──────────────────────────────
      case "payment_intent.payment_failed": {
        const pi = event.data.object;
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
        const payout = event.data.object;
        await supabase.from("payouts")
          .update({ status: "paid", arrival_date: new Date(payout.arrival_date * 1000).toISOString().slice(0, 10) })
          .eq("stripe_payout_id", payout.id);
        break;
      }

      case "payout.failed": {
        const payout = event.data.object;
        await supabase.from("payouts")
          .update({ status: "failed" })
          .eq("stripe_payout_id", payout.id);
        break;
      }

      // ── Refund issued ───────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object;
        await supabase.from("payment_transactions")
          .update({ status: "refunded" })
          .eq("stripe_charge_id", charge.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err.message);
    return new Response("Handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});