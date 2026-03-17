"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getActionByRegistryId, getActionsByUserId } from "@/lib/firestoreService";
import { ACTION_LABELS } from "@/lib/constants";
import { Action } from "@/types/action";
import { calculatePortfolioMetrics, PortfolioMetrics } from "@/lib/portfolioCalculator";
import VerificationBadge from "@/components/VerificationBadge";
import QRCode from "@/components/QRCode";
import Spinner from "@/components/ui/Spinner";
import PublicShell from "@/components/PublicShell";
import PerformanceBreakdownModal from "@/components/PerformanceBreakdownModal";
import Link from "next/link";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://registryearthcarbon.org";

export default function VerifyPage() {
    const params = useParams();
    const registryId = params.id as string;
    const [action, setAction] = useState<Action | null>(null);
    const [portfolio, setPortfolio] = useState<PortfolioMetrics | null>(null);
    const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function fetchAction() {
            setLoading(true);
            try {
                const data = await getActionByRegistryId(registryId);
                if (data) {
                    setAction(data);
                    if (data.userId) {
                        try {
                            const userActions = await getActionsByUserId(data.userId);
                            if (userActions.length > 0) {
                                setPortfolio(calculatePortfolioMetrics(userActions));
                            }
                        } catch (err) {
                            console.error("Failed to fetch user portfolio", err);
                        }
                    }
                } else {
                    setNotFound(true);
                }
            } catch {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        }
        if (registryId) {
            fetchAction();
        }
    }, [registryId]);

    if (loading) {
        return (
            <PublicShell>
                <div className="flex justify-center items-center py-20">
                    <Spinner size="lg" />
                </div>
            </PublicShell>
        );
    }

    if (notFound || !action) {
        return (
            <PublicShell>
                <div className="max-w-2xl mx-auto text-center py-20">
                    <h1 className="text-3xl font-black text-gray-800 mb-4">
                        Action Not Found
                    </h1>
                    <p className="text-gray-500">
                        No action found with Registry ID: <span className="font-mono font-bold">{registryId}</span>
                    </p>
                </div>
            </PublicShell>
        );
    }

    const formatDate = (timestamp: Action["createdAt"]) => {
        if (!timestamp) return "N/A";
        const date = typeof timestamp === "string"
            ? new Date(timestamp)
            : timestamp?.toDate?.()
                ? timestamp.toDate()
                : null;
        if (!date || isNaN(date.getTime())) return "N/A";
        return date.toLocaleString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Kolkata",
        });
    };

    const tco2e = action.co2eKg != null ? (action.co2eKg / 1000).toFixed(2) : null;
    const atmanirbhar = action.atmanirbharPercent != null ? action.atmanirbharPercent.toFixed(0) : null;
    const year = new Date().getFullYear();
    const verifyUrl = `${APP_URL}/verify/${action.registryId}`;

    const shareText = tco2e && atmanirbhar
        ? `Verified low-carbon action on Earth Carbon Registry!\nReduced: ${tco2e} tCO2e\n${atmanirbhar}% Atmanirbhar | ${year}\nVerify: ${verifyUrl}`
        : `Verified carbon action on Earth Carbon Registry!\nRegistry ID: ${action.registryId}\nVerify: ${verifyUrl}`;

    return (
        <PublicShell>
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-black text-gray-800">
                        Verification Page
                    </h1>
                    <p className="text-lg font-mono font-bold text-[rgb(32,38,130)]">
                        {action.registryId}
                    </p>
                    <VerificationBadge status={action.status || "pending"} />
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                    <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                            Action Details
                        </h2>
                    </div>
                    <div className="px-8 py-6 space-y-4">
                        <DetailRow label="Action Type" value={ACTION_LABELS[action.actionType] || action.actionType} />
                        <DetailRow label="Capacity / Quantity" value={`${action.quantity} ${action.unit}`} />
                        <DetailRow label="Location" value={action.address} />
                        {action.lat && action.lng && (
                            <DetailRow label="Geo-tag" value={`${action.lat.toFixed(6)}, ${action.lng.toFixed(6)}`} mono />
                        )}
                        <DetailRow label="Actor Type" value={action.actorType} />
                        <DetailRow label="Submitted" value={formatDate(action.createdAt)} />
                        {action.localPercent != null && (
                            <DetailRow label="Local Sourcing" value={`${action.localPercent}%`} />
                        )}
                        {action.indigenousPercent != null && (
                            <DetailRow label="Indigenous Technology" value={`${action.indigenousPercent}%`} />
                        )}
                        {action.communityPercent != null && (
                            <DetailRow label="Community Ownership" value={`${action.communityPercent}%`} />
                        )}
                        {action.jobsCreated != null && (
                            <DetailRow label="Jobs Created" value={`${action.jobsCreated} jobs`} />
                        )}
                    </div>
                </div>

                {action.status === "pending" && (
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 flex items-center gap-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600 flex-shrink-0">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <p className="text-sm text-yellow-800">
                            <strong>Under Review</strong> — This action is awaiting verification. Estimated values will shown below once admin verifies it.
                        </p>
                    </div>
                )}

                {action.status === "verified" && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-green-50 rounded-[2rem] border border-green-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-8 py-6 space-y-3">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                    Action CO₂e Reduction
                                </h3>
                                <p className="text-3xl font-black text-green-600">
                                    {tco2e != null ? (
                                        <>{tco2e} <span className="text-lg font-bold text-green-500">tCO₂e</span></>
                                    ) : (
                                        <span className="text-gray-400">N/A</span>
                                    )}
                                </p>
                            </div>
                            <div className="bg-blue-50 rounded-[2rem] border border-blue-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-8 py-6 space-y-3">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                    Action Atmanirbhar Score
                                </h3>
                                <p className="text-3xl font-black text-blue-600">
                                    {atmanirbhar != null
                                        ? <>{atmanirbhar}<span className="text-lg font-bold text-blue-500">%</span></>
                                        : <span className="text-gray-400">N/A</span>}
                                </p>
                                <p className="text-xs text-blue-500">{year}</p>
                            </div>
                        </div>

                        {/* Holistic Portfolio Overview */}
                        {portfolio && (
                            <div className="mt-8 bg-gradient-to-br from-[rgb(32,38,130)] to-[rgb(20,24,90)] rounded-[2rem] shadow-2xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10z" />
                                        <path d="M12 2v20" />
                                        <path d="M2 12h20" />
                                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                    </svg>
                                </div>
                                <div className="px-8 py-6 border-b border-blue-800/50 flex justify-between items-center relative z-10">
                                    <h2 className="text-sm font-bold text-blue-200 uppercase tracking-wider">
                                        Digital Climate Signature (Total Portfolio)
                                    </h2>
                                </div>
                                <div className="px-8 py-6 relative z-10">
                                    <p className="text-blue-100 mb-6 text-sm">
                                        This user's holistic impact across Energy, Water, and Waste resource pillars.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Link
                                            href={`/portfolio/${action.userId}`}
                                            className="group bg-white/10 hover:bg-white/20 border-2 border-transparent hover:border-green-400 transition-all rounded-2xl p-4 text-left backdrop-blur-sm cursor-pointer block"
                                        >
                                            <div className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">Total Impact</div>
                                            <div className="text-2xl font-black text-white group-hover:text-green-300 transition-colors">-{portfolio.totalTCO2e.toFixed(3)}</div>
                                            <div className="text-xs font-bold text-green-400">Total tCO₂e Reduced <span className="text-white/50 inline-block ml-1">→</span></div>
                                        </Link>

                                        <Link
                                            href={`/portfolio/${action.userId}`}
                                            className="group bg-white/10 hover:bg-white/20 border-2 border-transparent hover:border-cyan-400 transition-all rounded-2xl p-4 text-left backdrop-blur-sm cursor-pointer block"
                                        >
                                            <div className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">Total Atmanirbhar</div>
                                            <div className="text-2xl font-black text-white group-hover:text-cyan-300 transition-colors">{portfolio.totalAtmanirbharPercent.toFixed(1)}%</div>
                                            <div className="text-xs font-bold text-cyan-400">Resource Independence <span className="text-white/50 inline-block ml-1">→</span></div>
                                        </Link>
                                    </div>

                                    {/* 3 Pillar Mini Badges */}
                                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-5">
                                        <div className="flex items-center gap-2 bg-gradient-to-br from-orange-400/10 to-orange-500/5 border border-orange-400/20 px-3 py-1.5 rounded-full text-xs font-medium">
                                            <span className="text-orange-400 font-bold">Energy:</span>
                                            <span className="text-white">-{portfolio.energy.tCO2e.toFixed(1)}t</span>
                                            <span className="text-orange-300 font-mono">|</span>
                                            <span className="text-white">{portfolio.energy.atmanirbharAvg.toFixed(0)}%</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-gradient-to-br from-cyan-400/10 to-cyan-500/5 border border-cyan-400/20 px-3 py-1.5 rounded-full text-xs font-medium">
                                            <span className="text-cyan-400 font-bold">Water:</span>
                                            <span className="text-white">-{portfolio.water.tCO2e.toFixed(1)}t</span>
                                            <span className="text-cyan-300 font-mono">|</span>
                                            <span className="text-white">{portfolio.water.atmanirbharAvg.toFixed(0)}%</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-gradient-to-br from-emerald-400/10 to-emerald-500/5 border border-emerald-400/20 px-3 py-1.5 rounded-full text-xs font-medium">
                                            <span className="text-emerald-400 font-bold">Waste:</span>
                                            <span className="text-white">-{portfolio.waste.tCO2e.toFixed(1)}t</span>
                                            <span className="text-emerald-300 font-mono">|</span>
                                            <span className="text-white">{portfolio.waste.atmanirbharAvg.toFixed(0)}%</span>
                                        </div>
                                    </div>

                                    <p className="text-center text-xs text-blue-300/60 mt-4">* Click metrics to view full 3-pillar breakdown</p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-8 py-6 space-y-3">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                        Digital Signature (SHA-256)
                    </h3>
                    <p className="font-mono text-xs text-gray-600 break-all bg-gray-50 px-4 py-3 rounded-xl">
                        {action.sha256Hash || "Not generated"}
                    </p>
                    <p className="text-xs text-gray-400">
                        This hash proves the data has not been tampered with since submission.
                    </p>
                </div>


                <div className="flex justify-center">
                    <QRCode registryId={action.registryId} size={180} />
                </div>

                {/* Extended Disclaimer */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                    <p className="text-sm text-gray-600">
                        The values shown above are estimated based on user-submitted data.
                        Earth Carbon Foundation verifies all registered actions in good faith.
                        Actual impact may vary depending on real-world conditions.
                    </p>
                </div>

                <div className="space-y-3 text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Share This Action
                    </p>
                    <div className="flex justify-center gap-3 flex-wrap">
                        <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                            X
                        </a>
                        <a
                            href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(verifyUrl)}&title=${encodeURIComponent(shareText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 bg-[#0A66C2] text-white text-xs font-bold rounded-xl hover:bg-[#004182] transition-colors inline-flex items-center gap-2"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                            LinkedIn
                        </a>
                        <a
                            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 bg-[#25D366] text-white text-xs font-bold rounded-xl hover:bg-[#128C7E] transition-colors inline-flex items-center gap-2"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            WhatsApp
                        </a>
                        <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(verifyUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 bg-[#1877F2] text-white text-xs font-bold rounded-xl hover:bg-[#0C5DC7] transition-colors inline-flex items-center gap-2"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            Facebook
                        </a>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                navigator.clipboard.writeText(shareText);
                                const span = e.currentTarget.querySelector("span");
                                if (span) { span.textContent = "Copied!"; setTimeout(() => { span.textContent = "Instagram"; }, 2000); }
                            }}
                            className="px-4 py-2.5 bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                            <span>Instagram</span>
                        </a>
                    </div>
                </div>
            </div>
            <PerformanceBreakdownModal
                isOpen={isBreakdownModalOpen}
                onClose={() => setIsBreakdownModalOpen(false)}
                portfolio={portfolio}
            />
        </PublicShell >
    );
}

function DetailRow({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm font-medium text-gray-400 shrink-0">
                {label}
            </span>
            <span
                className={`text-sm text-gray-700 text-right ml-4 ${mono ? "font-mono" : "font-medium"}`}
            >
                {value}
            </span>
        </div>
    );
}
