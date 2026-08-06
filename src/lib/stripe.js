// src/lib/stripe.js

import { supabase } from "./supabase";
import { saveStripeLink } from "./db";

/**
 * Creates a Stripe payment link for an invoice.
 * Calls the "create-payment-link" Edge Function which uses the secret key.
 *
 * @param {object} invoice   - invoice row (with .client and .job joined)
 * @param {object} profile   - tradesperson profile
 * @returns {{ url: string, id: string } | null}
 */
export async function createPaymentLink(invoice, profile) {
  const { data, error } = await supabase.functions.invoke("create-payment-link", {
    body: {
      invoiceId:     invoice.id,
      invoiceNumber: invoice.invoice_number,
      amount:        invoice.amount,
      clientEmail:   invoice.client?.email ?? "",
      clientName:    invoice.client?.name  ?? "",
      tradeName:     profile.name,
      description:   invoice.job?.title ?? "Trade services",
    },
  });

  if (error || data?.error) {
    console.error("[stripe] createPaymentLink:", error ?? data.error);
    return null;
  }

  // Persist the link back to Supabase so it shows on the invoice permanently
  await saveStripeLink(invoice.id, {
    stripe_payment_link_id:  data.id,
    stripe_payment_link_url: data.url,
  });

  return data; // { url, id }
}
