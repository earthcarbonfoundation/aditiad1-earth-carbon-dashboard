"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import Spinner from "./ui/Spinner";
import StatusBadge from "./ui/StatusBadge";
import CustomDropdown from "./ui/CustomDropdown";
import Input from "./ui/Input";
import Button from "./ui/Button";
import { ACTION_LABELS, ACTION_STATUS_OPTIONS, ACTION_TYPES } from "@/lib/constants";
import { Action, ActionStatus } from "@/types/action";
import { getAllActionsRealtime, updateActionStatus, getAllActions, getActionsByUserId } from "@/lib/firestoreService";
import { useAuth } from "@/context/AuthContext";
import { calculatePortfolioMetrics, PortfolioMetrics } from "@/lib/portfolioCalculator";

export default function AdminActionTable() {
    const { user } = useAuth();
    const [actions, setActions] = useState<Action[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");

    const [verifyModalOpen, setVerifyModalOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState<Action | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [valuesApproved, setValuesApproved] = useState(false);
    const [userPortfolio, setUserPortfolio] = useState<PortfolioMetrics | null>(null);
    const [fetchingPortfolio, setFetchingPortfolio] = useState(false);
    const [verifyForm, setVerifyForm] = useState({
        co2eTonnes: "",
        atmanirbharPercent: "",
        status: "verified" as "verified" | "rejected",
        adminNotes: "",
    });
    const [verifySubmitting, setVerifySubmitting] = useState(false);

    useEffect(() => {
        const unsubscribe = getAllActionsRealtime((fetchedActions) => {
            setActions(fetchedActions);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const stats = useMemo(() => {
        const total = actions.length;
        const verified = actions.filter((a) => a.status === "verified").length;
        const pending = actions.filter((a) => a.status === "pending").length;
        const totalCo2e = actions.reduce((sum, a) => sum + (a.co2eKg || 0), 0);
        const totalRevenue = actions.filter((a) => a.registryId).length * 1;
        return { total, verified, pending, totalCo2e, totalRevenue };
    }, [actions]);

    const filteredActions = useMemo(() => {
        return actions.filter((a) => {
            if (statusFilter !== "all" && (a.status || "pending") !== statusFilter) return false;
            if (typeFilter !== "all" && a.actionType !== typeFilter) return false;
            return true;
        });
    }, [actions, statusFilter, typeFilter]);

    const handleStatusChange = async (actionId: string, newStatus: ActionStatus) => {
        setUpdatingId(actionId);
        setActions((prev) => prev.map((a) => (a.id === actionId ? { ...a, status: newStatus } : a)));
        try {
            await updateActionStatus(actionId, newStatus);
            toast.success(`Status updated to ${newStatus}`);
        } catch {
            toast.error("Failed to update status.");
            const allActions = await getAllActions();
            setActions(allActions);
        } finally {
            setUpdatingId(null);
        }
    };

    const openVerifyModal = async (action: Action) => {
        setSelectedAction(action);
        setIsEditMode(false);
        setValuesApproved(false);
        setUserPortfolio(null);
        setVerifyForm({
            co2eTonnes: action.co2eKg != null ? (action.co2eKg / 1000).toString() : "",
            atmanirbharPercent: action.atmanirbharPercent != null ? action.atmanirbharPercent.toString() : "",
            status: "verified",
            adminNotes: action.adminNotes || ""
        });
        setVerifyModalOpen(true);

        if (action.userId) {
            setFetchingPortfolio(true);
            try {
                const userActions = await getActionsByUserId(action.userId);
                if (userActions.length > 0) {
                    setUserPortfolio(calculatePortfolioMetrics(userActions));
                }
            } catch (err) {
                console.error("Error fetching user portfolio:", err);
            } finally {
                setFetchingPortfolio(false);
            }
        }
    };

    const handleAdminVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAction || !user) return;

        if (verifyForm.status === "verified") {
            if (!verifyForm.co2eTonnes || !verifyForm.atmanirbharPercent) {
                toast.error("tCO₂e and Atmanirbhar % are required for verification");
                return;
            }
        }

        setVerifySubmitting(true);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch("/api/admin/verify-action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    actionId: selectedAction.id,
                    co2eTonnes: Number(verifyForm.co2eTonnes) || 0,
                    atmanirbharPercent: Number(verifyForm.atmanirbharPercent) || 0,
                    status: verifyForm.status,
                    adminNotes: verifyForm.adminNotes,
                    adminUid: user.uid,
                    adminIdToken: idToken,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Verification failed");
            }

            toast.success(`Action ${verifyForm.status === "verified" ? "verified" : "rejected"} successfully!`);
            setVerifyModalOpen(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Verification failed");
        } finally {
            setVerifySubmitting(false);
        }
    };

    const handleExportCSV = () => {
        const headers = [
            "Registry ID",
            "Action Type",
            "Quantity",
            "Unit",
            "Actor Name",
            "Actor Type",
            "Email",
            "Phone",
            "Address",
            "CO2e (kg)",
            "Atmanirbhar %",
            "Status",
            "Created At",
        ];

        const rows = filteredActions.map((a) => [
            a.registryId || "",
            ACTION_LABELS[a.actionType] || a.actionType,
            String(a.quantity),
            a.unit,
            a.actorName || "",
            a.actorType || "",
            a.email || a.userEmail || "",
            a.phone || "",
            a.address || "",
            a.co2eKg != null ? a.co2eKg.toFixed(3) : "",
            a.atmanirbharPercent != null ? a.atmanirbharPercent.toFixed(1) : "",
            a.status || "pending",
            a.createdAt?.toDate?.().toISOString() || "",
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ecf-actions-${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const formatDate = (timestamp: Action["createdAt"]) => {
        if (!timestamp) return "N/A";
        // Handle Firestore Timestamp object
        const date = typeof timestamp === "string"
            ? new Date(timestamp)
            : timestamp?.toDate?.()
                ? timestamp.toDate()
                : null;
        if (!date || isNaN(date.getTime())) return "N/A";
        return date.toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            timeZone: "Asia/Kolkata",
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 shadow-sm">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Actions</p>
                    <p className="text-3xl font-black text-gray-800 mt-1">{stats.total}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 shadow-sm">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Verified</p>
                    <p className="text-3xl font-black text-green-600 mt-1">{stats.verified}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 shadow-sm">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total CO₂e</p>
                    <p className="text-3xl font-black text-[rgb(32,38,130)] mt-1">{(stats.totalCo2e / 1000).toLocaleString("en-IN", { maximumFractionDigits: 3 })} <span className="text-sm font-bold text-gray-400">tCO₂e</span></p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 shadow-sm">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Revenue</p>
                    <p className="text-3xl font-black text-gray-800 mt-1">₹{stats.totalRevenue.toLocaleString("en-IN")}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-3">
                    <CustomDropdown
                        size="md"
                        placeholder="All Statuses"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                            { value: "all", label: "All Statuses" },
                            ...ACTION_STATUS_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))
                        ]}
                        className="w-48"
                    />
                    <CustomDropdown
                        size="md"
                        placeholder="All Action Types"
                        value={typeFilter}
                        onChange={setTypeFilter}
                        options={[
                            { value: "all", label: "All Action Types" },
                            ...ACTION_TYPES.map((type) => ({ value: type.value, label: type.label }))
                        ]}
                        className="w-56"
                    />
                </div>
                <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-100 bg-transparent text-[rgb(32,38,130)] hover:bg-[rgba(32,38,130,0.05)] transition-colors text-sm font-medium"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Export CSV
                </button>
            </div>

            {filteredActions.length === 0 ? (
                <div className="bg-white/50 border-2 border-dashed border-gray-300 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                    <h3 className="text-gray-500 font-semibold text-lg">No actions found</h3>
                    <p className="text-gray-400 text-sm mt-1">
                        {statusFilter !== "all" || typeFilter !== "all"
                            ? "Try changing your filters."
                            : "Actions will appear here once users submit them."}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
                    <div className="w-full overflow-x-auto rounded-lg">
                        <table className="min-w-[900px] w-full">
                            <colgroup>
                                <col style={{ width: '110px' }} />
                                <col style={{ width: '160px' }} />
                                <col style={{ width: '140px' }} />
                                <col style={{ width: '100px' }} />
                                <col style={{ width: '200px' }} />
                                <col style={{ width: '110px' }} />
                                <col style={{ width: '130px' }} />
                                <col style={{ width: '160px' }} />
                            </colgroup>
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100/50">
                                    <th className="py-5 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Registry ID</th>
                                    <th className="py-5 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Action Type</th>
                                    <th className="py-5 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Actor</th>
                                    <th className="py-5 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">CO₂e (kg)</th>
                                    <th className="py-5 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">User Email</th>
                                    <th className="py-5 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="py-5 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="py-5 px-6 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredActions.map((action) => (
                                    <tr key={action.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6 text-sm font-mono font-semibold text-[rgb(32,38,130)]">
                                            {action.registryId ? (
                                                <a
                                                    href={`/verify/${action.registryId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:underline"
                                                >
                                                    {action.registryId}
                                                </a>
                                            ) : (
                                                <span className="text-gray-300">ECF-????</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-sm font-medium text-gray-700">
                                            {ACTION_LABELS[action.actionType] || action.actionType}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-500">
                                            {action.actorName || <span className="text-gray-300">N/A</span>}
                                        </td>
                                        <td className="py-4 px-6 text-sm font-medium">
                                            {action.co2eKg != null ? (
                                                <span className="text-gray-600">{action.co2eKg.toFixed(3)}</span>
                                            ) : (
                                                <span className="text-gray-300">N/A</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-400">
                                            {action.userEmail || <span className="text-gray-300">N/A</span>}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-400 whitespace-nowrap">
                                            {formatDate(action.createdAt)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <StatusBadge status={action.status || "pending"} />
                                        </td>
                                        <td className="px-4 py-3 align-middle">
                                            {(action.status || "pending") === "pending" ? (
                                                <button
                                                    onClick={() => openVerifyModal(action)}
                                                    className="w-full max-w-[120px] px-3 py-2 bg-[rgb(32,38,130)] text-white text-xs font-bold rounded-lg hover:bg-[rgb(22,28,100)] transition-colors text-center block mx-auto"
                                                >
                                                    Verify
                                                </button>
                                            ) : (
                                                <div className="w-full max-w-[120px] mx-auto">
                                                    <CustomDropdown
                                                        size="sm"
                                                        value={action.status || "pending"}
                                                        disabled={updatingId === action.id}
                                                        options={[
                                                            { value: "pending", label: "Pending" },
                                                            { value: "verified", label: "Verified" },
                                                            { value: "rejected", label: "Rejected" },
                                                        ]}
                                                        onChange={(newStatus) => handleStatusChange(action.id, newStatus as ActionStatus)}
                                                    />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Verification Modal */}
            {verifyModalOpen && selectedAction && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6 sm:p-6 overflow-hidden">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-full flex flex-col">
                        <div className="px-4 sm:px-5 py-3 border-b border-gray-100 shrink-0">
                            <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">Verify Action</h2>
                            <p className="text-sm font-medium text-gray-500 mt-1">
                                {selectedAction.registryId} — {ACTION_LABELS[selectedAction.actionType] || selectedAction.actionType}
                            </p>
                        </div>

                        <form onSubmit={handleAdminVerification} className="px-4 sm:px-5 py-4 space-y-4 overflow-y-auto grow">
                            <div className="bg-gray-50/80 rounded-xl p-4 space-y-2 text-sm border border-gray-100">
                                <p><span className="font-bold text-gray-400 uppercase tracking-wider text-[11px] mr-2">Quantity:</span>{" "}
                                    <span className="font-semibold text-gray-800">{selectedAction.quantity} {selectedAction.unit}</span></p>
                                <p><span className="font-bold text-gray-400 uppercase tracking-wider text-[11px] mr-2">Actor:</span>{" "}
                                    <span className="font-semibold text-gray-800">{selectedAction.actorName}</span></p>
                                <p><span className="font-bold text-gray-400 uppercase tracking-wider text-[11px] mr-2">Location:</span>{" "}
                                    <span className="font-semibold text-gray-800">{selectedAction.address}</span></p>
                                {selectedAction.localPercent != null && (
                                    <div className="pt-2 mt-2 border-t border-gray-200">
                                        <span className="font-bold text-gray-400 uppercase tracking-wider text-[11px] block mb-1">User’s Atmanirbhar inputs:</span>{" "}
                                        <span className="text-gray-700 font-medium text-xs break-words">
                                            Local {selectedAction.localPercent}%, Indigenous {selectedAction.indigenousPercent}%,
                                            Community {selectedAction.communityPercent}%, Jobs {selectedAction.jobsCreated}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* User Portfolio Context */}
                            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50">
                                <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                                    <span>Current Portfolio Context</span>
                                    {fetchingPortfolio && <span className="animate-pulse text-indigo-400 text-[10px]">Loading...</span>}
                                </h3>
                                {userPortfolio ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-white p-2 rounded-lg text-center border border-indigo-50">
                                            <div className="text-[10px] font-bold text-orange-500 uppercase">Energy</div>
                                            <div className="font-black text-gray-800 text-sm mt-0.5">{userPortfolio.energy.tCO2e.toFixed(1)} <span className="text-[10px] text-gray-400 font-semibold">tCO₂e</span></div>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg text-center border border-indigo-50">
                                            <div className="text-[10px] font-bold text-cyan-500 uppercase">Water</div>
                                            <div className="font-black text-gray-800 text-sm mt-0.5">{userPortfolio.water.tCO2e.toFixed(1)} <span className="text-[10px] text-gray-400 font-semibold">tCO₂e</span></div>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg text-center border border-indigo-50">
                                            <div className="text-[10px] font-bold text-emerald-500 uppercase">Waste</div>
                                            <div className="font-black text-gray-800 text-sm mt-0.5">{userPortfolio.waste.tCO2e.toFixed(1)} <span className="text-[10px] text-gray-400 font-semibold">tCO₂e</span></div>
                                        </div>
                                    </div>
                                ) : !fetchingPortfolio ? (
                                    <p className="text-xs text-gray-400 italic text-center py-2">No prior verified actions</p>
                                ) : null}
                            </div>

                            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
                                <h3 className="text-xs font-bold text-[rgb(32,38,130)] uppercase tracking-wider mb-3">Calculated Impact</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-white p-3 rounded-xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-blue-50">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">CO₂e Reduced (tonnes)</label>
                                        {isEditMode ? (
                                            <input
                                                type="number"
                                                step="any"
                                                value={verifyForm.co2eTonnes}
                                                onChange={(e) => setVerifyForm(f => ({ ...f, co2eTonnes: e.target.value }))}
                                                className="w-full px-2 py-1.5 border-b-2 border-blue-200 text-lg font-black text-green-600 focus:border-[rgb(32,38,130)] outline-none bg-transparent"
                                                placeholder="e.g. 23.5"
                                            />
                                        ) : (
                                            <div className="text-xl font-black text-green-600 truncate">
                                                {verifyForm.co2eTonnes || "0"} <span className="text-[10px] font-bold text-green-500">tCO₂e</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-white p-3 rounded-xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-blue-50">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Atmanirbhar Score</label>
                                        {isEditMode ? (
                                            <input
                                                type="number"
                                                step="any"
                                                value={verifyForm.atmanirbharPercent}
                                                onChange={(e) => setVerifyForm(f => ({ ...f, atmanirbharPercent: e.target.value }))}
                                                className="w-full px-2 py-1.5 border-b-2 border-blue-200 text-lg font-black text-blue-600 focus:border-[rgb(32,38,130)] outline-none bg-transparent"
                                                placeholder="e.g. 50"
                                            />
                                        ) : (
                                            <div className="text-xl font-black text-blue-600 truncate">
                                                {verifyForm.atmanirbharPercent || "0"}<span className="text-[10px] font-bold text-blue-500">%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                    {isEditMode ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditMode(false)}
                                            className="col-span-2 w-full px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                                        >
                                            Save Edited Values
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => setValuesApproved(true)}
                                                className={`w-full px-4 py-2.5 flex items-center justify-center gap-2 ${valuesApproved ? 'bg-green-600 text-white shadow-sm' : 'bg-green-100 text-green-700 hover:bg-green-200'} text-xs font-bold rounded-xl transition-all`}
                                            >
                                                {valuesApproved && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                                )}
                                                {valuesApproved ? "Approved" : "Approve Values"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setIsEditMode(true); setValuesApproved(false); }}
                                                className="w-full bg-white px-4 py-2.5 text-[rgb(32,38,130)] border border-blue-100 hover:bg-blue-50 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                Edit Values
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Final Status</label>
                                <div className="relative">
                                    <select
                                        value={verifyForm.status}
                                        onChange={(e) => setVerifyForm((f) => ({ ...f, status: e.target.value as "verified" | "rejected" }))}
                                        className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm font-bold focus:border-[rgb(32,38,130)] outline-none transition-colors cursor-pointer appearance-none"
                                    >
                                        <option value="verified" className="text-gray-900 font-bold">Verified</option>
                                        <option value="rejected" className="text-gray-900 font-bold">Rejected</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                        <svg stroke='currentColor' fill='none' strokeWidth='2' viewBox='0 0 24 24' strokeLinecap='round' strokeLinejoin='round' height='1em' width='1em'><polyline points='6 9 12 15 18 9'></polyline></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setVerifyModalOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={verifySubmitting}
                                    className="flex-1 px-4 py-3 rounded-xl bg-[rgb(32,38,130)] text-white text-sm font-bold shadow-md shadow-[rgba(32,38,130,0.2)] hover:bg-[rgb(22,28,100)] hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {verifySubmitting ? "Processing..." : "Submit Decision"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
