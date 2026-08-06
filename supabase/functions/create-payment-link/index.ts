
import Stripe from "https://esm.sh/stripe@15.0.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-04-10",
  httpClient: Stripe.createFetchHttpClient(),
});

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { invoiceId, invoiceNumber, profileId, amount, clientEmail, clientName, tradeName, description } = await req.json();
    const amountPence = Math.round(Number(amount) * 100);
    const link = await stripe.paymentLinks.create({
      line_items: [{ price_data: { currency:"gbp", product_data:{ name: description||"Trade services", description:`Invoice ${invoiceNumber} from ${tradeName}` }, unit_amount: amountPence }, quantity:1 }],
      after_completion: { type:"redirect", redirect:{ url:`${Deno.env.get("APP_URL")??"https://tradie.app"}/paid?invoice=${invoiceId}` } },
      metadata: { invoice_id:invoiceId, invoice_number:invoiceNumber, profile_id:profileId??"", client_name:clientName??"", client_email:clientEmail??"" },
    });
    return new Response(JSON.stringify({ url:link.url, id:link.id }), { headers:CORS });
  } catch (err) {
  const message = err instanceof Error ? err.message : String(err);
    return new Response(  JSON.stringify({ error: message }), {  status: 500,  headers: CORS,  });
}
});
