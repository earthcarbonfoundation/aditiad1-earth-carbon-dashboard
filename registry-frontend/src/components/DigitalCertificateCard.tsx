"use client";

import React from "react";
import Link from "next/link";
import QRCode from "./QRCode";
import { Action } from "@/types/action";
import { ACTION_LABELS } from "@/lib/constants";

interface DigitalCertificateCardProps {
    action: Action;
}

export default function DigitalCertificateCard({ action }: DigitalCertificateCardProps) {
    const tco2e = action.co2eKg != null ? (action.co2eKg / 1000).toFixed(2) : "N/A";
    const atmanirbhar = action.atmanirbharPercent != null ? action.atmanirbharPercent.toFixed(0) : "N/A";
    const year = new Date().getFullYear();
    const verifyPath = `/verify/${action.registryId}`;

    const formatDate = (timestamp: Action["createdAt"]) => {
        if (!timestamp) return "N/A";
        const date = typeof timestamp === "string"
            ? new Date(timestamp)
            : timestamp?.toDate?.()
                ? timestamp.toDate()
                : null;
        if (!date || isNaN(date.getTime())) return "N/A";
        return date.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-[rgb(32,38,130)] shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-[360px] sm:max-w-md mx-auto">
            <div className="text-center mb-4 sm:mb-6 pb-4 sm:pb-6 border-b-2 border-gray-100">
                <h2 className="text-base sm:text-lg font-black text-gray-800 uppercase tracking-tight mb-2 sm:mb-3">
                    Earth Carbon Registry
                </h2>
                {action.status === "verified" ? (
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-100 rounded-full">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-blue-700">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-xs sm:text-sm font-bold text-blue-700">VERIFIED</span>
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-100 rounded-full">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-700">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span className="text-xs sm:text-sm font-bold text-yellow-700">REGISTERED</span>
                    </div>
                )}
            </div>

            <div className="flex justify-center mb-4 sm:mb-6">
                <QRCode registryId={action.registryId} size={120} />
            </div>

            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <h3 className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider text-center border-b pb-2">
                    Action Summary
                </h3>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center flex flex-col justify-center min-h-[80px]">
                        <div className="text-[10px] sm:text-xs text-gray-500 mb-1">Carbon Reduced</div>
                        {action.status === "verified" ? (
                            <>
                                <div className="text-xl sm:text-2xl font-black text-blue-600">-{tco2e}</div>
                                <div className="text-[10px] sm:text-xs font-bold text-blue-600">tCO₂e</div>
                            </>
                        ) : (
                            <div className="text-sm sm:text-base font-bold text-gray-400">Pending</div>
                        )}
                    </div>
                    <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center flex flex-col justify-center min-h-[80px]">
                        <div className="text-[10px] sm:text-xs text-gray-500 mb-1">Atmanirbhar</div>
                        {action.status === "verified" ? (
                            <>
                                <div className="text-xl sm:text-2xl font-black text-blue-600">{atmanirbhar}%</div>
                                <div className="text-[10px] sm:text-xs font-bold text-blue-600">{year}</div>
                            </>
                        ) : (
                            <div className="text-sm sm:text-base font-bold text-gray-400">Pending</div>
                        )}
                    </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Registry ID</span>
                        <span className="font-mono font-bold text-gray-800">{action.registryId}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Action Type</span>
                        <span className="font-bold text-gray-800 text-right max-w-[55%] truncate">{ACTION_LABELS[action.actionType] || action.actionType}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Location</span>
                        <span className="font-bold text-gray-800 truncate max-w-[55%]" title={action.address}>
                            {action.address?.split(",")[0] || "N/A"}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Registered</span>
                        <span className="font-bold text-gray-800">{formatDate(action.createdAt)}</span>
                    </div>
                </div>
            </div>

            <div className="text-center pt-3 sm:pt-4 border-t-2 border-gray-100">
                <p className="text-[10px] sm:text-xs text-gray-400 mb-1">Verify online:</p>
                <Link
                    href={verifyPath}
                    className="text-[10px] sm:text-xs font-mono text-[rgb(32,38,130)] break-all cursor-pointer hover:underline"
                >
                    registryearthcarbon.org/verify/{action.registryId}
                </Link>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[10px] sm:text-xs text-gray-400 text-center">
                    Estimated impact based on user-submitted data.
                    Earth Carbon Foundation verifies all actions in good faith.
                </p>
            </div>
        </div>
    );
}
