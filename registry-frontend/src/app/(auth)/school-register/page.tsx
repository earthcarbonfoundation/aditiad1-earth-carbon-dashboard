"use client";

import React from "react";
import SchoolRegistrationForm from "@/components/SchoolRegistrationForm";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/useUserProfile";
import Spinner from "@/components/ui/Spinner";

export default function SchoolRegisterPage() {
    const { profile, loading } = useUserProfile();
    const router = useRouter();

    if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg" /></div>;

    if (!profile || profile.role !== "admin") {
        router.replace("/profile");
        return null;
    }

    return (
        <main className="min-h-screen bg-slate-50 pt-12 px-4 sm:px-6 pb-32 opacity-100">
            <div className="max-w-5xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => router.back()}
                            className="w-14 h-14 rounded-3xl bg-white border-2 border-slate-100 flex items-center justify-center text-gray-400 hover:text-[rgb(32,38,130)] hover:border-blue-100 transition-all shadow-sm group"
                        >
                            <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
                        </button>
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 tracking-tight">School Climate Action Module</h1>
                            <p className="text-slate-500 font-bold mt-1 uppercase text-xs tracking-widest bg-white/50 inline-block px-3 py-1 rounded-full border border-slate-100">
                                Step-by-Step Concierge Flow
                            </p>
                        </div>
                    </div>
                </div>

                <SchoolRegistrationForm />
            </div>
        </main>
    );
}
