// src/hooks/useAppData.js

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  getProfile, createProfile, updateProfile,
  getJobs, getClients, getInvoices, getQuotes,
  getBookingRequests, getTransactions, getPayouts,
  getReviews, getCertifications, getReferrals,
  getMyListings,
} from "../lib/db";

export function useAppData() {
  const { user, isLoaded } = useUser();

  const [profile, setProfile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async (profileId) => {
    const [
      { data: jobs },
      { data: clients },
      { data: invoices },
      { data: quotes },
      { data: bookingRequests },
      { data: transactions },
      { data: payouts },
      { data: reviews },
      { data: certifications },
      { data: referrals },
      { data: listings },
    ] = await Promise.all([
      getJobs(profileId),
      getClients(profileId),
      getInvoices(profileId),
      getQuotes(profileId),
      getBookingRequests(profileId),
      getTransactions(profileId),
      getPayouts(profileId),
      getReviews(profileId),
      getCertifications(profileId),
      getReferrals(profileId),
      getMyListings(profileId),
    ]);

    setData({
      jobs:             jobs            ?? [],
      clients:          clients         ?? [],
      invoices:         invoices        ?? [],
      quotes:           quotes          ?? [],
      booking_requests: bookingRequests ?? [],
      transactions:     transactions    ?? [],
      payouts:          payouts         ?? [],
      reviews:          reviews         ?? [],
      certifications:   certifications  ?? [],
      referrals:        referrals       ?? [],
      listings:         listings        ?? [],
    });
  }, []);

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    let cancelled = false;
    const MAX_RETRIES = 2;

    async function init(attempt = 0) {
      setLoading(true);
      setError(null);

      try {
        // 1. Look up profile by the CURRENT Clerk user ID
        const { data: prof, error: fetchErr } = await getProfile(user.id);

        // 2. Profile does not exist → create it
        if (fetchErr?.code === "PGRST116") {
          const name =
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            "Tradesperson";

          const email =
            user.primaryEmailAddress?.emailAddress ?? "";

          const trade =
            user.unsafeMetadata?.profession ?? "";

          const { data: created, error: createErr } =
            await createProfile(user.id, {
              name,
              email,
              trade,
            });

          if (createErr) {
            console.error("[useAppData] CREATE PROFILE ERROR", createErr);

            if (!cancelled) {
              setError(createErr);
              setLoading(false);
            }

            return;
          }

          if (cancelled) return;

          setProfile(created);

          // Load all data belonging to the newly created profile
          await loadAll(created.id);

          if (!cancelled) {
            setLoading(false);
          }

          return;
        }

        // 3. Any other Supabase error → STOP.
        if (fetchErr) {
          console.error("[useAppData] GET PROFILE ERROR", fetchErr);

          if (!cancelled) {
            setError(fetchErr);
            setLoading(false);
          }

          return;
        }

        // 4. Existing profile found
        if (cancelled) return;

        setProfile(prof);

        // 5. Load all existing data
        await loadAll(prof.id);

        if (!cancelled) {
          setLoading(false);
        }

      } catch (err) {
        console.error("[useAppData] init() failed:", err);

        const isNetworkError =
          err instanceof TypeError && /fetch/i.test(err.message);

        if (isNetworkError && attempt < MAX_RETRIES) {
          const delay = 500 * (attempt + 1);

          setTimeout(() => {
            if (!cancelled) {
              init(attempt + 1);
            }
          }, delay);

          return;
        }

        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isLoaded, loadAll]);

  const refresh = useCallback(async () => {
    if (profile?.id) await loadAll(profile.id);
  }, [profile?.id, loadAll]);

  const saveProfile = useCallback(async (updates) => {
    const targetId = profile?.id || user?.id;
    if (!targetId) return { data: null, error: new Error("No target ID found for update") };

    // Appel direct à updateProfile importé de ../lib/db
    const { data: updated, error } = await updateProfile(targetId, updates);
    
    if (!error && updated) {
      setProfile(updated);
    }
    
    return { data: updated, error };
  }, [profile?.id, user?.id]);

  return { profile, data, setData, loading, error, refresh, saveProfile, setProfile };
}