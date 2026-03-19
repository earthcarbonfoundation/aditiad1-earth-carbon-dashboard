"use client";

import React, { useEffect, useState } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import AdminActionTable from "@/components/AdminActionTable";
import AdminUserTable from "@/components/AdminUserTable";
import AdminSchoolTable from "@/components/AdminSchoolTable";
import Spinner from "@/components/ui/Spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function AdminPage() {
    const { profile, loading } = useUserProfile();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<"actions" | "users" | "schools">("actions");

    useEffect(() => {
        if (!loading && profile && profile.role !== "admin") {
            toast.error("Access denied — Admin only");
            router.replace("/profile");
        }
    }, [loading, profile, router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-82px)] bg-slate-50">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!profile || profile.role !== "admin") return null;

    return (
        <main className="min-h-[calc(100vh-82px)] bg-gray-50 px-4 sm:px-6 lg:px-8 py-6">
            <div className="w-full space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                            Admin Dashboard
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage registry operations, oversee actions, and view registered users.
                        </p>
                    </div>

                    <div className="flex w-full sm:w-fit p-1 bg-gray-200/60 rounded-xl">
                        <button
                            onClick={() => setActiveTab("actions")}
                            className={`flex-1 sm:flex-none px-6 py-3 min-h-[44px] rounded-lg text-sm font-bold transition-all ${activeTab === "actions"
                                ? "bg-white text-[rgb(32,38,130)] shadow-sm"
                                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                }`}
                        >
                            Registered Actions
                        </button>
                        <button
                            onClick={() => setActiveTab("users")}
                            className={`flex-1 sm:flex-none px-6 py-3 min-h-[44px] rounded-lg text-sm font-bold transition-all ${activeTab === "users"
                                ? "bg-white text-[rgb(32,38,130)] shadow-sm"
                                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                }`}
                        >
                            Users
                        </button>
                        <button
                            onClick={() => setActiveTab("schools")}
                            className={`flex-1 sm:flex-none px-6 py-3 min-h-[44px] rounded-lg text-sm font-bold transition-all ${activeTab === "schools"
                                ? "bg-white text-[rgb(32,38,130)] shadow-sm"
                                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                }`}
                        >
                            Schools
                        </button>
                    </div>
                </div>

                {activeTab === "actions" && <AdminActionTable />}
                {activeTab === "users" && <AdminUserTable />}
                {activeTab === "schools" && (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <Link 
                                href="/school-register"
                                className="bg-[rgb(32,38,130)] text-white px-6 py-3 rounded-xl font-black text-sm shadow-xl shadow-blue-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                            >
                                <span>+ Register New School</span>
                            </Link>
                        </div>
                        <AdminSchoolTable />
                    </div>
                )}
            </div>
        </main>
    );
}
