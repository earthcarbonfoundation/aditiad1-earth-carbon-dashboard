"use client";

import React from "react";
import { PortfolioMetrics } from "@/lib/portfolioCalculator";
import { ACTION_LABELS } from "@/lib/constants";
import { Action } from "@/types/action";
import { calculateEnergySavings } from "@/lib/savings/energy";
import { calculateWaterSavings } from "@/lib/savings/water";
import { calculateWasteSavings } from "@/lib/savings/waste";

export default function PerformanceBreakdownModal({
    isOpen,
    onClose,
    portfolio,
}: {
    isOpen: boolean;
    onClose: () => void;
    portfolio: PortfolioMetrics | null;
}) {
    if (!isOpen || !portfolio) return null;

    const renderPillar = (title: string, colorClass: string, bgClass: string, textClass: string, pillar: any) => {
        let savingsData = null;
        let testId = "";

        if (pillar.actions.length > 0) {
            if (title === "Energy") {
                const kwhSaved = (pillar.tCO2e * 1000) / 0.82;
                savingsData = calculateEnergySavings(kwhSaved);
                testId = "energy-savings-display-modal";
            } else if (title === "Water") {
                const litersSaved = (pillar.tCO2e * 100000);
                savingsData = calculateWaterSavings(litersSaved);
                testId = "water-savings-display-modal";
            } else if (title === "Waste") {
                const kgDiverted = (pillar.tCO2e * 1000) / 2.5;
                savingsData = calculateWasteSavings(kgDiverted, 'organic');
                testId = "waste-savings-display-modal";
            }
        }

        return (
            <div className={`rounded-xl p-4 sm:p-5 border ${colorClass} ${bgClass} mb-4`}>
                <div className="flex justify-between items-start mb-3">
                    <h3 className={`font-black uppercase tracking-wider text-sm ${textClass} mt-1`}>
                        {title} Performance
                    </h3>
                    <div className="text-right">
                        <div className="font-bold text-gray-800 text-sm">-{pillar.tCO2e.toFixed(3)} tCO₂e</div>
                        <div className={`font-bold text-xs ${textClass}`}>{pillar.atmanirbharAvg.toFixed(1)}% Self-Reliance</div>
                        {savingsData && (
                            <div
                                data-testid={testId}
                                className="mt-1 cursor-default group relative inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-full border border-indigo-100"
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
                    <div className="text-xs text-gray-400 italic">No actions recorded in this pillar yet.</div>
                ) : (
                    <div className="space-y-2">
                        {pillar.actions.map((action: Action, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-white/60 rounded px-3 py-2 text-xs">
                                <span className="font-medium text-gray-700 w-1/2 truncate pr-2" title={ACTION_LABELS[action.actionType] || action.actionType}>
                                    {ACTION_LABELS[action.actionType] || action.actionType}
                                </span>
                                <span className="text-gray-500 whitespace-nowrap">{action.quantity} {action.unit}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-3xl sm:rounded-[2rem] shadow-2xl w-full max-w-lg relative z-10 flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden border border-gray-100 mt-4 sm:mt-0">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-[rgb(32,38,130)] tracking-tight">Digital Climate Signature</h2>
                        <p className="text-sm font-semibold text-gray-500 mt-1">Holistic Resource Independence</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center transition-colors shadow-sm"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-2">
                    {/* Summary Boxes */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 text-center">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Impact</div>
                            <div className="text-2xl font-black text-green-600">-{portfolio.totalTCO2e.toFixed(3)}</div>
                            <div className="text-[10px] font-bold text-green-500">tCO₂e Reduced</div>
                        </div>
                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-center">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Atmanirbhar</div>
                            <div className="text-2xl font-black text-blue-600">{portfolio.totalAtmanirbharPercent.toFixed(1)}%</div>
                            <div className="text-[10px] font-bold text-blue-500">Resource Independence</div>
                        </div>
                    </div>

                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">3-Pillar Breakdown</h3>

                    {renderPillar("Energy", "border-orange-100", "bg-orange-50/30", "text-orange-600", portfolio.energy)}
                    {renderPillar("Water", "border-cyan-100", "bg-cyan-50/30", "text-cyan-600", portfolio.water)}
                    {renderPillar("Waste", "border-emerald-100", "bg-emerald-50/30", "text-emerald-600", portfolio.waste)}

                    {portfolio.other && portfolio.other.actions.length > 0 &&
                        renderPillar("Other", "border-gray-200", "bg-gray-50/50", "text-gray-600", portfolio.other)
                    }

                </div>
            </div>
        </div>
    );
}
