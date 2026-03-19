"use client";

import React from "react";
import { ActionStatus } from "@/types/action";

import { ReactNode } from "react";

interface VerificationBadgeProps {
    status: string;
}

const badgeConfig: Record<
    string,
    { label: string; sublabel: string; bg: string; border: string; text: string; icon: ReactNode }
> = {
    verified: {
        label: "VERIFIED",
        sublabel: "Carbon Credit Eligible",
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        ),
    },
    pending: {
        label: "PENDING VERIFICATION",
        sublabel: "Awaiting Review",
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        text: "text-yellow-700",
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
        ),
    },
    rejected: {
        label: "REJECTED",
        sublabel: "Not Eligible",
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
        ),
    },
    pledged: {
        label: "PLEDGED",
        sublabel: "Awaiting Review",
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        text: "text-yellow-700",
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
        ),
    },
};

export default function VerificationBadge({ status }: VerificationBadgeProps) {
    const config = (badgeConfig as any)[status] || badgeConfig.pending;

    return (
        <div
            className={`
        inline-flex items-center gap-3 px-6 py-4
        rounded-2xl border-2
        ${config.bg} ${config.border}
      `}
        >
            <span className="text-2xl">{config.icon}</span>
            <div>
                <p className={`text-sm font-black tracking-wider ${config.text}`}>
                    {config.label}
                </p>
                <p className={`text-xs font-medium ${config.text} opacity-70`}>
                    {config.sublabel}
                </p>
            </div>
        </div>
    );
}
