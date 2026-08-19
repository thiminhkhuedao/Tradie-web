// supabase/functions/send-invoice-reminders/index.ts
//
// Appelée quotidiennement par pg_cron (voir sql/001_invoice_reminders.sql).
// Cherche TOUTES les factures "unpaid" (peu importe la date d'échéance —
// pas besoin d'être en retard) et renvoie l'email de facture (via
// send-invoice-email, avec reminder: true) si :
//   - le dernier envoi date de plus de reminder_frequency_days (défaut 7)
//   - reminder_count < plafond : 5 pour le plan Free, illimité pour le plan Pro
//
// Secrets requis (supabase secrets set ...):
//   CRON_SECRET                 (chaîne aléatoire choisie par toi — doit
//                                 matcher le <CRON_SECRET> du pg_cron job)
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (déjà présents par défaut)
//   SUPABASE_ANON_KEY           (déjà présent par défaut — nécessaire pour
//                                 l'en-tête apikey lors de l'appel interne
//                                 à send-invoice-email)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY          = Deno.env.get("SUPABASE_ANON_KEY")!;
const CRON_SECRET       = Deno.env.get("CRON_SECRET")!;

interface InvoiceClient {
  id: string;
  name: string;
  email: string | null;
}

interface InvoiceJob {
  title: string | null;
}

interface InvoiceProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  bank_name: string | null;
  sort_code: string | null;
  account_number: string | null;
  iban: string | null;
  bic: string | null;
  bank_account_holder: string | null;
  invoice_notes: string | null;
  notif_overdue_reminder: boolean | null;
  reminder_frequency_days: number | null;
  reminder_max_count: number | null;
  plan: string | null;
  currency: string | null;
}

interface InvoiceRow {
  id: string;
  invoice_number: string;
  amount: number;
  due_date: string | null;
  status: string;
  reminder_count: number;
  last_reminder_sent_at: string | null;
  stripe_payment_link_url: string | null;
  client: InvoiceClient | null;
  job: InvoiceJob | null;
  profile: InvoiceProfile | null;
}

Deno.serve(async (req) => {
  // Protège la fonction : seul le job cron (qui connaît le secret) peut l'appeler.
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: invoices, error } = await admin
    .from("invoices")
    .select(`
      id, invoice_number, amount, due_date, status, reminder_count,
      last_reminder_sent_at, stripe_payment_link_url,
      client:clients ( id, name, email ),
      job:jobs ( title ),
      profile:profiles (
        id, name, email, phone, bank_name, sort_code, account_number,
        iban, bic, bank_account_holder,
        invoice_notes, notif_overdue_reminder, reminder_frequency_days, reminder_max_count, plan, currency
      )
    `)
    .eq("status", "unpaid")
    .lt("reminder_count", 999) // filet de sécurité large ; le vrai plafond (plan) est appliqué plus bas
    .returns<InvoiceRow[]>();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let sentCount = 0;
  const errors: string[] = [];

  for (const invoice of invoices ?? []) {
    const profile = invoice.profile;
    if (!profile) continue;
    if (!invoice.client?.email) continue;

    // Plafond des rappels selon le plan : illimité pour Pro (sauf si le pro a
    // lui-même défini un plafond plus bas), 5 maximum pour Free quoi qu'il arrive.
    const maxReminders = profile.plan === "pro"
      ? (profile.reminder_max_count && profile.reminder_max_count > 0 ? profile.reminder_max_count : Infinity)
      : Math.min(profile.reminder_max_count ?? 5, 5);
    const frequencyDays = profile.reminder_frequency_days ?? 7;

    if (invoice.reminder_count >= maxReminders) continue;

    const lastSent = invoice.last_reminder_sent_at ? new Date(invoice.last_reminder_sent_at) : null;
    const dueForReminder =
      !lastSent || Date.now() - lastSent.getTime() >= frequencyDays * 24 * 60 * 60 * 1000;

    if (!dueForReminder) continue;

    const formattedDueDate = invoice.due_date
      ? new Date(invoice.due_date).toLocaleDateString("en-GB", {
          day: "numeric", month: "long", year: "numeric",
        })
      : null;

    // On réutilise ta fonction send-invoice-email existante (même template,
    // mêmes champs) plutôt que dupliquer la logique Resend/HTML ici.
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-invoice-email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to:            invoice.client.email,
        clientName:    invoice.client.name,
        tradeName:     profile.name,
        tradeEmail:    profile.email,
        tradePhone:    profile.phone,
        invoiceNumber: invoice.invoice_number,
        amount:        invoice.amount,
        dueDate:       formattedDueDate,
        jobTitle:      invoice.job?.title ?? null,
        paymentUrl:    invoice.stripe_payment_link_url ?? null,
        bankName:      profile.bank_name,
        sortCode:      profile.sort_code,
        accountNumber: profile.account_number,
        iban:          profile.iban,
        bic:           profile.bic,
        bankAccountHolder: profile.bank_account_holder,
        currencyCode:  profile.currency ?? "EUR",
        invoiceNotes:  profile.invoice_notes,
        reminder:      true,
      }),
    });

    if (res.ok) {
      await admin
        .from("invoices")
        .update({
          reminder_count: invoice.reminder_count + 1,
          last_reminder_sent_at: new Date().toISOString(),
        })
        .eq("id", invoice.id);
      sentCount++;
    } else {
      errors.push(`Facture ${invoice.invoice_number}: ${await res.text()}`);
    }
  }

  return new Response(JSON.stringify({ sent: sentCount, errors }), {
    headers: { "Content-Type": "application/json" },
  });
});