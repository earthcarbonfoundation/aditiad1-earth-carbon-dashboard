"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getActionsByUserId } from "@/lib/firestoreService";
import { calculatePortfolioMetrics, PortfolioMetrics } from "@/lib/portfolioCalculator";
import { ACTION_LABELS } from "@/lib/constants";
import { Action } from "@/types/action";
import PublicShell from "@/components/PublicShell";
import Spinner from "@/components/ui/Spinner";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { calculateEnergySavings } from "@/lib/savings/energy";
import { calculateWaterSavings } from "@/lib/savings/water";
import { calculateWasteSavings } from "@/lib/savings/waste";

export default function PublicPortfolioPage() {
    const params = useParams();
    const userId = params.id as string | undefined;

    const [portfolio, setPortfolio] = useState<PortfolioMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPortfolio() {
            if (!userId) {
                setLoading(false);
                return;
            }
            try {
                const userActions = await getActionsByUserId(userId);
                if (userActions.length > 0) {
                    setPortfolio(calculatePortfolioMetrics(userActions));
                }
            } catch (err) {
                console.error("Error fetching actions:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchPortfolio();
    }, [userId]);

    if (loading) {
        return (
            <PublicShell>
                <div className="flex justify-center flex-col items-center min-h-[50vh] space-y-4">
                    <Spinner size="lg" />
                    <p className="text-gray-500 font-semibold animate-pulse">Loading Digital Climate Signature...</p>
                </div>
            </PublicShell>
        );
    }

    if (!portfolio || portfolio.totalTCO2e === 0) {
        return (
            <PublicShell>
                <div className="max-w-xl mx-auto text-center space-y-6 py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    </div>
                    <h1 className="text-2xl font-black text-gray-800">No Verified Actions Found</h1>
                    <p className="text-gray-500">This digital climate signature doesn't securely contain any verified actions yet.</p>
                    <Link href="/">
                        <Button variant="secondary">Return Home</Button>
                    </Link>
                </div>
            </PublicShell>
        );
    }

    const renderPillar = (title: string, colorClass: string, bgClass: string, textClass: string, pillar: any) => {
        let savingsData = null;
        let testId = "";

        if (pillar.actions.length > 0) {
            if (title === "Energy") {
                // Approximate kWh based on co2e for now until actions explicitly store kWh
                // Standard emission factor roughly ~0.82 kg/kWh in India
                const kwhSaved = (pillar.tCO2e * 1000) / 0.82;
                savingsData = calculateEnergySavings(kwhSaved);
                testId = "energy-savings-display";
            } else if (title === "Water") {
                // Approximate liters saved based on some generic factor 
                // Assumes 1 tCO2e of water treatment ~ 100,000 liters
                const litersSaved = (pillar.tCO2e * 100000);
                savingsData = calculateWaterSavings(litersSaved);
                testId = "water-savings-display";
            } else if (title === "Waste") {
                // Approximate kg diverted
                const kgDiverted = (pillar.tCO2e * 1000) / 2.5; // generic factor
                savingsData = calculateWasteSavings(kgDiverted, 'organic');
                testId = "waste-savings-display";
            }
        }

        return (
            <div className={`rounded-xl p-5 sm:p-6 border ${colorClass} ${bgClass} mb-4 shadow-sm`}>
                <div className="flex justify-between items-start mb-4">
                    <h3 className={`font-black uppercase tracking-wider text-sm sm:text-base ${textClass} mt-1`}>
                        {title} Performance
                    </h3>
                    <div className="text-right">
                        <div className="font-black text-gray-800 text-sm sm:text-base">-{pillar.tCO2e.toFixed(3)} tCO₂e</div>
                        <div className={`font-bold text-xs sm:text-sm ${textClass}`}>{pillar.atmanirbharAvg.toFixed(1)}% Self-Reliance</div>
                        {savingsData && (
                            <div
                                data-testid={testId}
                                className="mt-1 cursor-default group relative inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-full border border-indigo-100"
                            >
                                ₹ {Number(savingsData.amount).toLocaleString("en-IN")} INR Saved

                                {/* Custom Tooltip Overlay */}
                                <div className="absolute top-full right-0 mt-2 w-48 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50 text-left bg-gray-900 text-white text-[10px] p-2 rounded-lg font-normal shadow-xl whitespace-normal pointer-events-none">
                                    {savingsData.note}
                                    <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 rotate-45"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {pillar.actions.length === 0 ? (
                    <div className="text-sm text-gray-400 italic bg-white/50 p-4 rounded-lg text-center border border-dashed border-gray-200">
                        No verified actions recorded in this pillar yet.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {pillar.actions.map((action: Action, idx: number) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white/80 rounded-lg px-4 py-3 text-sm border border-gray-50 shadow-[0_2px_4px_rgba(0,0,0,0.02)] gap-1 sm:gap-4 hover:shadow-[0_4px_8px_rgba(0,0,0,0.04)] transition-shadow">
                                <span className="font-bold text-gray-700 truncate" title={ACTION_LABELS[action.actionType] || action.actionType}>
                                    {action.registryId} — {ACTION_LABELS[action.actionType] || action.actionType}
                                </span>
                                <span className="text-gray-500 font-medium sm:text-right whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded text-xs">
                                    {action.quantity} {action.unit}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <PublicShell>
            <div className="max-w-2xl mx-auto px-4 sm:px-0">
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden flex flex-col mb-8">

                    {/* Header */}
                    <div className="bg-gradient-to-br from-[rgb(32,38,130)] to-[rgb(20,24,90)] p-6 sm:p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10z" />
                                <path d="M12 2v20" />
                                <path d="M2 12h20" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                        </div>
                        <div className="relative z-10 text-center space-y-2">
                            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Public Digital Climate Signature</h1>
                            <p className="text-blue-200 font-medium text-xs sm:text-sm">Verified Holistic Resource Independence Portfolio</p>
                            <p className="text-[10px] text-blue-300 font-mono mt-2 bg-black/20 inline-block px-3 py-1 rounded-full border border-blue-400/30">ID: {userId}</p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="px-5 py-6 sm:px-8 border-b border-gray-100 bg-gray-50/30">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white border-2 border-blue-100 rounded-2xl p-4 text-center shadow-[0_4px_12px_rgb(0,0,0,0.03)] flex flex-col justify-center items-center relative overflow-hidden group hover:border-blue-300 transition-colors">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-[rgb(32,38,130)] rounded-t-2xl"></div>
                                <div className="p-1.5 bg-blue-50 rounded-full text-blue-500 mb-2 group-hover:scale-110 transition-transform">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                </div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Impact</div>
                                <div className="text-3xl font-black text-blue-600 tracking-tighter">-{portfolio.totalTCO2e.toFixed(3)}</div>
                                <div className="text-[10px] font-bold text-blue-500 mt-1">tCO₂e Reduced</div>
                            </div>

                            <div className="bg-white border-2 border-cyan-100 rounded-2xl p-4 text-center shadow-[0_4px_12px_rgb(0,0,0,0.03)] flex flex-col justify-center items-center relative overflow-hidden group hover:border-cyan-300 transition-colors">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-t-2xl"></div>
                                <div className="p-1.5 bg-cyan-50 rounded-full text-cyan-500 mb-2 group-hover:scale-110 transition-transform">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                </div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Atmanirbhar</div>
                                <div className="text-3xl font-black text-cyan-600 tracking-tighter">{portfolio.totalAtmanirbharPercent.toFixed(1)}%</div>
                                <div className="text-[10px] font-bold text-cyan-500 mt-1">Resource Independence</div>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Body */}
                    <div className="p-6 sm:p-10">
                        <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            3-Pillar Breakdown
                        </h2>

                        {renderPillar("Energy", "border-orange-100", "bg-orange-50/40", "text-orange-600", portfolio.energy)}
                        {renderPillar("Water", "border-cyan-100", "bg-cyan-50/40", "text-cyan-600", portfolio.water)}
                        {renderPillar("Waste", "border-blue-100", "bg-blue-50/40", "text-[rgb(32,38,130)]", portfolio.waste)}

                        {portfolio.other && portfolio.other.actions.length > 0 &&
                            renderPillar("Other", "border-gray-200", "bg-gray-50/50", "text-gray-600", portfolio.other)
                        }
                    </div>
                </div>

                <div className="text-center pb-12">
                    <p className="text-gray-400 text-xs font-medium max-w-lg mx-auto">
                        This document serves as a public ledger record of verified impact. Earth Carbon Foundation guarantees the authenticity of these registered metrics.
                    </p>
                </div>
            </div>
        </PublicShell>
    );
}
