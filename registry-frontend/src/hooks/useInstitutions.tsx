"use client";

import { useState, useEffect, useCallback } from "react";
import { getUserInstitutions } from "@/lib/firestoreService";
import { Institution } from "@/types/institution";

export function useInstitutions(userId: string | undefined) {
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInstitutions = useCallback(async () => {
        if (!userId) {
            setInstitutions([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const data = await getUserInstitutions(userId);
            setInstitutions(data);
        } catch (err) {
            console.error("Failed to fetch institutions:", err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchInstitutions();
    }, [fetchInstitutions]);

    return {
        institutions,
        loading,
        refreshInstitutions: fetchInstitutions,
    };
}
