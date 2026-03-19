"use client";

import { useState, useEffect, useCallback } from "react";
import { getUserProfile, createUserProfile } from "@/lib/firestoreService";
import { UserProfile } from "@/types/user";
import { useAuth } from "@/context/AuthContext";


export function useUserProfile() {
    const { user, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            let existing = await getUserProfile(user.uid);

            if (!existing) {
                await createUserProfile({
                    uid: user.uid,
                    email: user.email || "",
                    displayName: user.displayName || "",
                    photoURL: user.photoURL || null,
                    role: "user",
                    socialHandles: ["", "", ""],
                });
                existing = await getUserProfile(user.uid);
            }

            setProfile(existing);
        } catch (err) {
            console.error("Failed to fetch/create user profile:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading) {
            fetchProfile();
        }
    }, [authLoading, fetchProfile]);

    const needsSetup =
        profile !== null &&
        (!profile.socialHandles ||
            profile.socialHandles.every((h) => h.trim() === ""));

    return {
        profile,
        loading: authLoading || loading,
        needsSetup,
        refreshProfile: fetchProfile,
    };
}
