"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getSchoolByRegistryId } from "@/lib/schoolFirestoreService";
import { School } from "@/types/school";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Link from "next/link";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://registryearthcarbon.org";

export default function SchoolRegisterSuccessPage() {
    const searchParams = useSearchParams();
    const registryId = searchParams.get("id");
    const [school, setSchool] = useState<School | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSchool() {
            if (!registryId) {
                setLoading(false);
                return;
            }
            try {
                const data = await getSchoolByRegistryId(registryId);
                setSchool(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchSchool();
    }, [registryId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-50">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!registryId || !school) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
                <h1 className="text-2xl font-black text-slate-800 mb-2">
                    School Not Found
                </h1>
                <p className="text-slate-500 mb-6 font-medium">
                    No registry ID was provided or the school could not be found.
                </p>
                <Link href="/school-register">
                    <Button>Try Again</Button>
                </Link>
            </div>
        );
    }

    const verifyUrl = `${APP_URL}/verify/school/${school.registryId}`;
    const tco2e = school.tco2e_annual != null ? school.tco2e_annual.toFixed(2) : "0.00";

    return (
        <div className="min-h-screen bg-slate-50 px-4 md:px-8 py-20">
            <div className="max-w-2xl mx-auto text-center space-y-10">
                <div className="space-y-4">
                    <div className="w-24 h-24 bg-blue-100 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[rgb(32,38,130)]">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                        Registration Success!
                    </h1>
                    <p className="text-slate-500 font-bold max-w-lg mx-auto">
                        {school.schoolName} has been successfully added to the Earth Carbon Registry.
                    </p>
                </div>

                {/* Impact Brief */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registry ID</p>
                        <p className="text-2xl font-black font-mono text-[rgb(32,38,130)]">{school.registryId}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Annual Impact</p>
                        <p className="text-2xl font-black text-slate-800">{tco2e} <span className="text-sm">tCO₂e</span></p>
                    </div>
                    <div className="sm:col-span-2 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[rgb(32,38,130)] font-black">
                                {school.attribution_percentage}%
                            </div>
                            <p className="text-xs font-bold text-slate-500">Credited Attribution</p>
                        </div>
                        <Link href={verifyUrl} className="text-sm font-black text-[rgb(32,38,130)] hover:underline">
                            View Public Certificate →
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/admin">
                        <button className="px-10 py-5 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]">
                            Back to Admin
                        </button>
                    </Link>
                    <Link href={verifyUrl}>
                        <button className="px-10 py-5 bg-[rgb(32,38,130)] text-white rounded-2xl font-black shadow-xl shadow-blue-900/20 hover:scale-[1.05] transition-all active:scale-[0.98]">
                            View Verification Page
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
