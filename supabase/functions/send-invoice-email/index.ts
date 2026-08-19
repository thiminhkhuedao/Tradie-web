const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const {
      to,              // client email address
      clientName,
      tradeName,
      tradeEmail,
      tradePhone,
      invoiceNumber,
      amount,          // number, in pounds
      dueDate,         // formatted string, e.g. "28 May 2026"
      jobTitle,
      paymentUrl,      // Stripe link (optional)
      bankName,
      sortCode,
      accountNumber,
      iban,
      bic,
      bankAccountHolder,
      invoiceNotes,
      currencyCode = "EUR", // devise du profil (voir lib/currency.js) — plus de £ codé en dur
      reminder = false, // true when sent by the automatic overdue-reminder cron
    } = await req.json();

    const CURRENCY_SYMBOLS: Record<string, string> = {
      GBP: "£", EUR: "€", USD: "$", CAD: "C$", AUD: "A$", CHF: "CHF ",
    };
    const fmtMoney = (n: number) =>
      `${CURRENCY_SYMBOLS[currencyCode] ?? CURRENCY_SYMBOLS.EUR}${Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;

    // ── Branded HTML email ────────────────────────────
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f4f1;color:#131211}
  .wrap{max-width:580px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e3de}
  .top{background:#E8500A;padding:20px 32px;display:flex;align-items:center;gap:12px}
  .logo{color:#fff;font-size:20px;font-weight:900;letter-spacing:-0.5px}
  .body{padding:36px 36px 28px}
  .meta-row{display:flex;justify-content:space-between;margin-bottom:28px}
  .inv-num{font-size:22px;font-weight:800;letter-spacing:-0.5px}
  .inv-sub{font-size:13px;color:#888;margin-top:4px}
  .bill-box{background:#f7f6f3;border-radius:10px;padding:16px 20px;margin-bottom:24px}
  .bill-lbl{font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px}
  .bill-name{font-size:16px;font-weight:700}
  .bill-sub{font-size:13px;color:#666;margin-top:3px}
  table.items{width:100%;border-collapse:collapse;margin-bottom:20px}
  table.items th{font-size:12px;font-weight:700;color:#aaa;text-transform:uppercase;padding:8px 0;border-bottom:1px solid #eee;text-align:left}
  table.items td{padding:14px 0;border-bottom:1px solid #eee;font-size:14px}
  .total-row{display:flex;justify-content:space-between;padding-top:14px;border-top:2px solid #131211;margin-bottom:28px}
  .total-lbl{font-size:16px;font-weight:700}
  .total-amt{font-size:24px;font-weight:900;color:#E8500A;letter-spacing:-0.5px}
  .pay-btn{display:block;background:#E8500A;color:#fff;text-decoration:none;padding:15px 28px;border-radius:10px;font-size:16px;font-weight:700;text-align:center;margin:0 0 24px}
  .bank-box{background:#f7f6f3;border-radius:10px;padding:16px 20px;font-size:13px;color:#555;margin-bottom:20px}
  .bank-box b{color:#131211}
  .footer{text-align:center;padding:18px;font-size:12px;color:#aaa;border-top:1px solid #eee}
  .footer a{color:#E8500A;text-decoration:none}
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <div class="logo">⚡ Vimen</div>
  </div>
  <div class="body">
    <p style="font-size:15px;margin-bottom:24px">Hi ${clientName},</p>
    ${reminder ? `
    <div style="background:#FEF3E2;border:1px solid #F5C97A;border-radius:8px;padding:12px 16px;margin-bottom:24px;font-size:13px;color:#92400E;font-weight:600">
      Friendly reminder — this invoice is still awaiting payment.
    </div>` : ""}
    <p style="font-size:14px;color:#555;margin-bottom:28px;line-height:1.6">
      Please find your invoice from <strong>${tradeName}</strong> below.
      ${dueDate ? `Payment is due by <strong>${dueDate}</strong>.` : ""}
    </p>

    <div class="meta-row">
      <div>
        <div class="inv-num">${invoiceNumber}</div>
        ${dueDate ? `<div class="inv-sub">Due: ${dueDate}</div>` : ""}
      </div>
      <div style="text-align:right;font-size:13px;color:#888">
        <div style="font-weight:700;color:#131211">${tradeName}</div>
        <div>${tradeEmail}</div>
        ${tradePhone ? `<div>${tradePhone}</div>` : ""}
      </div>
    </div>

    <div class="bill-box">
      <div class="bill-lbl">Bill to</div>
      <div class="bill-name">${clientName}</div>
    </div>

    <table class="items">
      <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        <tr>
          <td>${jobTitle || "Services rendered"}</td>
          <td style="text-align:right;font-weight:700">${fmtMoney(amount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-row">
      <span class="total-lbl">Total due</span>
      <span class="total-amt">${fmtMoney(amount)}</span>
    </div>

    ${paymentUrl ? `<a class="pay-btn" href="${paymentUrl}">Pay now — ${fmtMoney(amount)} →</a>` : ""}

    ${(bankName || sortCode || accountNumber || iban || bic) ? `
    <div class="bank-box">
      <div style="font-weight:700;margin-bottom:10px">Bank transfer details</div>
      ${bankAccountHolder ? `<div><b>Account holder:</b> ${bankAccountHolder}</div>` : ""}
      ${iban          ? `<div><b>IBAN:</b> ${iban.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim()}</div>` : ""}
      ${bic           ? `<div><b>BIC/SWIFT:</b> ${bic}</div>` : ""}
      ${bankName      ? `<div><b>Bank:</b> ${bankName}</div>` : ""}
      ${sortCode      ? `<div><b>Sort code:</b> ${sortCode}</div>` : ""}
      ${accountNumber ? `<div><b>Account:</b> ${accountNumber}</div>` : ""}
      <div style="margin-top:8px"><b>Reference:</b> ${invoiceNumber}</div>
    </div>` : ""}

    ${invoiceNotes ? `<p style="font-size:13px;color:#888;line-height:1.6">${invoiceNotes}</p>` : ""}
  </div>
  <div class="footer">
    Sent via <a href="https://Vimen.app">Vimen</a>
  </div>
</div>
</body>
</html>`;

    const RESEND_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "invoices@Vimen.app";
    const FROM_NAME  = Deno.env.get("FROM_NAME")  ?? "Vimen";

    const res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    `${tradeName} via ${FROM_NAME} <${FROM_EMAIL}>`,
        to:      [to],
        subject: `${reminder ? "Reminder: " : ""}Invoice ${invoiceNumber} — ${fmtMoney(amount)} due${dueDate ? ` by ${dueDate}` : ""}`,
        html,
      }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message ?? "Resend API error");

    return new Response(JSON.stringify({ success: true, id: result.id }), { headers: CORS });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("send-invoice-email error:", message);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: CORS });
  }
});
