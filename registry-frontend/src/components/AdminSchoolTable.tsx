"use client";

import React, { useEffect, useState } from "react";
import { getAllSchoolsRealtime } from "@/lib/schoolFirestoreService";
import { School, SchoolStatus } from "@/types/school";
import { SCHOOL_STATUS_OPTIONS } from "@/lib/constants/schoolConstants";
import Spinner from "@/components/ui/Spinner";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import StatusBadge from "@/components/ui/StatusBadge";
import CustomDropdown from "@/components/ui/CustomDropdown";
import Input from "@/components/ui/Input";

export default function AdminSchoolTable() {
    const { user } = useAuth();
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const [verifyModalOpen, setVerifyModalOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [verifyForm, setVerifyForm] = useState({
        schoolName: "",
        address: "",
        electricity_kWh_year: "",
        fuel_consumption_litres: "",
        waste_generated_kg: "",
        water_consumption_m3: "",
        attribution_pct_energy: "",
        baseline_source: "" as School["baseline_source"],
        status: "verified" as SchoolStatus,
        adminNotes: "",
    });
    const [verifySubmitting, setVerifySubmitting] = useState(false);

    useEffect(() => {
        const unsubscribe = getAllSchoolsRealtime(
            (data) => {
                setSchools(data);
                setLoading(false);
            },
            (error) => {
                console.error("Firestore Error in AdminSchoolTable:", error);
                toast.error(`Failed to sync schools: ${error.message || "Please check permissions"}`);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    const openVerifyModal = (school: School) => {
        setSelectedSchool(school);
        setIsEditMode(false);
        setVerifyForm({
            schoolName: school.schoolName,
            address: school.address,
            electricity_kWh_year: school.electricity_kWh_year?.toString() || "",
            fuel_consumption_litres: school.fuel_consumption_litres?.toString() || "",
            waste_generated_kg: school.waste_generated_kg?.toString() || "",
            water_consumption_m3: school.water_consumption_m3?.toString() || "",
            attribution_pct_energy: (school.attribution_pct_energy || 100).toString(),
            baseline_source: school.baseline_source,
            status: "verified",
            adminNotes: school.adminNotes || "",
        });
        setVerifyModalOpen(true);
    };

    const handleAdminVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSchool || !user) return;

        setVerifySubmitting(true);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch("/api/admin/verify-school", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    schoolId: selectedSchool.id,
                    status: verifyForm.status,
                    adminNotes: verifyForm.adminNotes,
                    adminUid: user.uid,
                    adminIdToken: idToken,
                    editedData: isEditMode ? {
                        schoolName: verifyForm.schoolName,
                        address: verifyForm.address,
                        electricity_kWh_year: verifyForm.electricity_kWh_year,
                        fuel_consumption_litres: verifyForm.fuel_consumption_litres,
                        waste_generated_kg: verifyForm.waste_generated_kg,
                        water_consumption_m3: verifyForm.water_consumption_m3,
                        attribution_pct_energy: verifyForm.attribution_pct_energy,
                        baseline_source: verifyForm.baseline_source,
                    } : null
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Verification failed");
            }

            toast.success(`School ${verifyForm.status === "verified" ? "verified" : "rejected"} successfully!`);
            setVerifyModalOpen(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Verification failed");
        } finally {
            setVerifySubmitting(false);
        }
    };

    const handleQuickStatusChange = async (schoolId: string, newStatus: SchoolStatus) => {
        setUpdatingId(schoolId);
        try {
            const idToken = await user?.getIdToken();
            const res = await fetch("/api/admin/verify-school", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    schoolId: schoolId,
                    status: newStatus,
                    adminUid: user?.uid,
                    adminIdToken: idToken,
                }),
            });
            if (!res.ok) throw new Error("Update failed");
            toast.success(`Status updated to ${newStatus}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Spinner size="lg" /></div>;

    const stats = {
        total: schools.length,
        verified: schools.filter(s => s.status === "verified").length,
        pledged: schools.filter(s => s.status === "pledged").length,
        totalCO2e: schools.reduce((acc, s) => acc + (s.tco2e_annual || 0), 0)
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    label="Total Schools" 
                    value={stats.total} 
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m22 10-10-5L2 10l10 5 10-5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>}
                    color="text-blue-600 bg-blue-50"
                />
                <StatCard 
                    label="Verified & Approved" 
                    value={stats.verified} 
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
                    color="text-green-600 bg-green-50"
                />
                <StatCard 
                    label="Pending Review" 
                    value={stats.pledged} 
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                    color="text-orange-600 bg-orange-50"
                />
                <StatCard 
                    label="Total CO2e Reduced" 
                    value={`${(stats.totalCO2e).toFixed(1)}t`}
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 20A7 7 0 0 1 4 13V5a2 2 0 0 1 2-2h5V2l3 3-3 3V6H6v7a5 5 0 0 0 10 0v-2h2v2a7 7 0 0 1-7 7z"/><path d="M12 14v4"/></svg>}
                    color="text-purple-600 bg-purple-50"
                />
            </div>
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">School Name</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Registry ID</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">CO2e (Kg)</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Created At</th>
                                <th className="px-6 py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {schools.map((school) => (
                                <tr key={school.id} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-800">{school.schoolName}</td>
                                    <td className="px-6 py-4 font-mono text-sm text-[rgb(32,38,130)] font-bold">
                                        <a href={`/verify/school/${school.registryId}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            {school.registryId}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={school.status} />
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-700">{(school.tco2e_annual * 1000).toLocaleString() || "N/A"}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-800">{school.contactPerson}</div>
                                        <div className="text-xs text-gray-400">{school.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                        {school.createdAt && (school.createdAt as any).toDate 
                                            ? (school.createdAt as any).toDate().toLocaleDateString("en-IN") 
                                            : typeof school.createdAt === "string" 
                                                ? new Date(school.createdAt).toLocaleDateString("en-IN") 
                                                : "N/A"}
                                    </td>
                                    <td className="px-6 py-4 min-w-[140px]">
                                        {school.status === "pledged" ? (
                                            <button
                                                onClick={() => openVerifyModal(school)}
                                                className="w-full px-3 py-2 bg-[rgb(32,38,130)] text-white text-xs font-black rounded-lg hover:shadow-lg transition-all"
                                            >
                                                Verify
                                            </button>
                                        ) : (
                                            <div className="w-full max-w-[120px] ml-auto">
                                                <CustomDropdown
                                                    size="sm"
                                                    value={school.status}
                                                    disabled={updatingId === school.id}
                                                    options={SCHOOL_STATUS_OPTIONS}
                                                    onChange={(val) => handleQuickStatusChange(school.id, val as SchoolStatus)}
                                                />
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {schools.length === 0 && (
                        <div className="px-6 py-20 text-center flex flex-col items-center justify-center space-y-4">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[rgb(32,38,130)] opacity-40">
                                    <path d="m22 10-10-5L2 10l10 5 10-5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
                                </svg>
                            </div>
                            <h3 className="text-xl font-black text-gray-800">No Schools Registered Yet</h3>
                            <p className="text-gray-500 max-w-sm mx-auto font-medium">
                                Start your journey by onboarding the first school to the Climate Asset Registry.
                            </p>
                            <a 
                                href="/school-register" 
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[rgb(32,38,130)] text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 hover:scale-[1.02] transition-all"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                Onboard First School
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Verification Modal */}
            {verifyModalOpen && selectedSchool && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6 overflow-hidden">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-full flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Verify School Profile</h2>
                                <p className="text-sm font-bold text-[rgb(32,38,130)] mt-1">{selectedSchool.registryId}</p>
                            </div>
                            <button onClick={() => setVerifyModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <form onSubmit={handleAdminVerification} className="px-8 py-6 space-y-6 overflow-y-auto grow">
                            {/* School Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-1 ml-1">School Name</label>
                                    <Input
                                        disabled={!isEditMode}
                                        value={verifyForm.schoolName}
                                        onChange={(e) => setVerifyForm(f => ({ ...f, schoolName: e.target.value }))}
                                        className={!isEditMode ? "bg-gray-50 border-transparent font-bold !py-3" : "!py-3"}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-1 ml-1">Address</label>
                                    <Input
                                        disabled={!isEditMode}
                                        value={verifyForm.address}
                                        onChange={(e) => setVerifyForm(f => ({ ...f, address: e.target.value }))}
                                        className={!isEditMode ? "bg-gray-50 border-transparent font-bold !py-3" : "!py-3"}
                                    />
                                </div>
                            </div>

                            {/* Impact Data */}
                            <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100/50 space-y-4">
                                <h3 className="text-xs font-black text-[rgb(32,38,130)] uppercase tracking-widest border-b border-blue-100/50 pb-3 mb-4 flex items-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h7"/><path d="M16 5V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v2"/><path d="M3 12h18"/><path d="M18 16.5l3 3-3 3"/><path d="M21 19.5h-9"/></svg>
                                    Baseline Consumption Data
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Electricity (kWh)</label>
                                        <Input
                                            type="number"
                                            disabled={!isEditMode}
                                            value={verifyForm.electricity_kWh_year}
                                            onChange={(e) => setVerifyForm(f => ({ ...f, electricity_kWh_year: e.target.value }))}
                                            className={!isEditMode ? "bg-white border-transparent font-black text-blue-800 !py-2" : "!py-2"}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Water (m³)</label>
                                        <Input
                                            type="number"
                                            disabled={!isEditMode}
                                            value={verifyForm.water_consumption_m3}
                                            onChange={(e) => setVerifyForm(f => ({ ...f, water_consumption_m3: e.target.value }))}
                                            className={!isEditMode ? "bg-white border-transparent font-black text-blue-800 !py-2" : "!py-2"}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Waste (Kg)</label>
                                        <Input
                                            type="number"
                                            disabled={!isEditMode}
                                            value={verifyForm.waste_generated_kg}
                                            onChange={(e) => setVerifyForm(f => ({ ...f, waste_generated_kg: e.target.value }))}
                                            className={!isEditMode ? "bg-white border-transparent font-black text-blue-800 !py-2" : "!py-2"}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <div className="text-sm font-bold text-gray-500">
                                        Calculated Impact: <span className="text-[rgb(32,38,130)] font-black">{(selectedSchool.tco2e_annual * 1000).toLocaleString() || 0} Kg CO₂e</span>
                                    </div>
                                    {!isEditMode ? (
                                        <button type="button" onClick={() => setIsEditMode(true)} className="text-[rgb(32,38,130)] text-xs font-black hover:underline flex items-center gap-1">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                            Edit Values
                                        </button>
                                    ) : (
                                        <button type="button" onClick={() => setIsEditMode(false)} className="bg-[rgb(32,38,130)] text-white px-3 py-1 rounded-full text-xs font-bold shadow-md hover:bg-blue-900 transition-colors">
                                            Apply Changes
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Decision & Notes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-2 ml-1">Verification Decision</label>
                                    <div className="relative">
                                        <select
                                            value={verifyForm.status}
                                            onChange={(e) => setVerifyForm(f => ({ ...f, status: e.target.value as SchoolStatus }))}
                                            className="w-full px-5 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm font-black focus:border-[rgb(32,38,130)] focus:bg-white outline-none transition-all appearance-none"
                                        >
                                            <option value="verified">Verify & Approve</option>
                                            <option value="rejected">Reject Submission</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-2 ml-1">Admin Notes (Optional)</label>
                                    <textarea
                                        value={verifyForm.adminNotes}
                                        onChange={(e) => setVerifyForm(f => ({ ...f, adminNotes: e.target.value }))}
                                        placeholder="Add any verification notes here..."
                                        className="w-full px-5 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm font-medium focus:border-[rgb(32,38,130)] focus:bg-white outline-none transition-all min-h-[100px]"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setVerifyModalOpen(false)}
                                    className="flex-1 px-8 py-4 rounded-2xl bg-gray-100 text-gray-500 font-black hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={verifySubmitting}
                                    className="flex-1 px-8 py-4 rounded-2xl bg-[rgb(32,38,130)] text-white font-black shadow-xl shadow-blue-900/20 hover:scale-[1.02] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {verifySubmitting ? <Spinner size="sm" light /> : "Submit Decision"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-5 group hover:shadow-xl hover:shadow-blue-900/5 transition-all">
            <div className={`p-4 rounded-2xl ${color} transition-transform group-hover:scale-110 duration-300`}>
                {icon}
            </div>
            <div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-2xl font-black text-gray-800">{value}</p>
            </div>
        </div>
    );
}
