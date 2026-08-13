// utils/errorHandler.js — Translates raw errors into 3-part UX messages

export function formatUserError(rawError) {
  // Extract string message if rawError is an Error object or string
  const message = typeof rawError === "string" 
    ? rawError 
    : rawError?.message || rawError?.code || "";

  // 1. Payment Errors
  if (message.includes("card_declined") || message.includes("INSUFFICIENT_FUNDS")) {
    return {
      title: "Payment Unsuccessful",
      reason: "Your bank declined the transaction.",
      action: "Please try a different card or contact your bank.",
    };
  }

  if (message.includes("expired_card")) {
    return {
      title: "Card Expired",
      reason: "The payment card on file has passed its expiration date.",
      action: "Please update your payment method details and try again.",
    };
  }

  // 2. Network / Connection Errors
  if (message.includes("NetworkError") || message.includes("Failed to fetch") || !navigator.onLine) {
    return {
      title: "Connection Lost",
      reason: "Your device lost connection to our servers.",
      action: "Check your internet connection and click 'Try Again'.",
    };
  }

  // 3. Duplicate / Conflict Errors
  if (message.includes("already exists") || message.includes("UNIQUE constraint")) {
    return {
      title: "Account Already Exists",
      reason: "An account with this email address has already been created.",
      action: "Try signing in instead or reset your password.",
    };
  }

  // 4. Default Fallback (Prevents raw DB/server logs from showing)
  return {
    title: "Action Could Not Be Completed",
    reason: "Something unexpected occurred on our side.",
    action: "Please try again in a moment. If the issue continues, reach out to support.",
  };
}