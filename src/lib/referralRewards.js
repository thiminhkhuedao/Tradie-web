// src/lib/referralRewards.js
// Automatically applies Pro reward to both referrer and referred
// when a referral is marked as qualified.
// No Stripe required — uses pro_until column in profiles table.

import { supabase } from "./supabase";

/**
 * Apply 2 months Pro to a profile.
 * If they already have pro_until in the future, extends from that date.
 * If they're on Free, starts from now.
 */
async function applyProMonths(profileId, months = 2) {
  // Get current pro_until
  const { data: profile } = await supabase
    .from("profiles")
    .select("pro_until")
    .eq("id", profileId)
    .single();

  const base = profile?.pro_until && new Date(profile.pro_until) > new Date()
    ? new Date(profile.pro_until)  // extend from existing expiry
    : new Date();                   // start from now

  base.setMonth(base.getMonth() + months);

  return supabase
    .from("profiles")
    .update({ pro_until: base.toISOString() })
    .eq("id", profileId);
}

/**
 * Called when a referral is qualified.
 * Rewards both the referrer and the referred user.
 *
 * @param {string} referralId - the referral row id
 * @param {string} referrerId - profile id of the person who referred
 * @param {string} referredEmail - email of the person who was referred
 */
export async function rewardReferral(referralId, referrerId, referredEmail) {
  // Find the referred user's profile by email
  const { data: referredProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", referredEmail)
    .single();

  if (!referredProfile) {
    console.warn("[referral] Referred user not found yet:", referredEmail);
    return { success: false, reason: "referred_not_found" };
  }

  // Apply Pro to both profiles in parallel
  const [r1, r2] = await Promise.all([
    applyProMonths(referrerId, 2),
    applyProMonths(referredProfile.id, 2),
  ]);

  if (r1.error || r2.error) {
    console.error("[referral] Failed to apply Pro:", r1.error || r2.error);
    return { success: false, reason: "update_failed" };
  }

  // Mark referral as rewarded
  await supabase
    .from("referrals")
    .update({ status: "rewarded", rewarded_at: new Date().toISOString() })
    .eq("id", referralId);

  return { success: true };
}

/**
 * Check if a profile is currently on Pro.
 * Used in app to gate Pro features.
 */
export function isPro(profile) {
  if (!profile?.pro_until) return false;
  return new Date(profile.pro_until) > new Date();
}

/**
 * Returns days remaining on Pro, or 0 if Free.
 */
export function proDaysRemaining(profile) {
  if (!isPro(profile)) return 0;
  return Math.ceil((new Date(profile.pro_until) - new Date()) / (1000*60*60*24));
}