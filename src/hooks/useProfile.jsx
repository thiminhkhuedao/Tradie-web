// src/hooks/useProfile.jsx

import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { getProfile, createProfile } from "../lib/db";

const ProfileCtx = createContext(null);

export function ProfileProvider({ children }) {
  const { user, isLoaded } = useUser();
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  useEffect(() => {
    if (!isLoaded || !user) return;

    async function load() {
      setLoading(true);
      const { data, error } = await getProfile(user.id);

      if (error?.code === "PGRST116") {
        // Profile row doesn't exist yet — first login, create it
        const name  = user.fullName || user.firstName || "Tradesperson";
        const email = user.primaryEmailAddress?.emailAddress ?? "";
        const { data: created, error: createErr } = await createProfile(user.id, { name, email });
        if (createErr) { setError(createErr); setLoading(false); return; }
        setProfile(created);
      } else if (error) {
        setError(error);
      } else {
        setProfile(data);
      }
      setLoading(false);
    }

    load();
  }, [user, isLoaded]);

  return (
    <ProfileCtx.Provider value={{ profile, setProfile, loading, error }}>
      {children}
    </ProfileCtx.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileCtx);
  if (!ctx) throw new Error("useProfile must be inside <ProfileProvider>");
  return ctx;
}
