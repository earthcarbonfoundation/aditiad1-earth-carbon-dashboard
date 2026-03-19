"use client";

import React from "react";
import { ActionStatus } from "@/types/action";

import { ReactNode } from "react";

interface StatusBadgeProps {
    status: string;
    className?: string;
}

const statusConfig: Record<
    string,
    { label: string; bg: string; text: string; icon: ReactNode }
> = {
    pending: {
        label: "Pending",
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
        ),
    },
    verified: {
        label: "Verified",
        bg: "bg-blue-100",
        text: "text-blue-700",
        icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        ),
    },
    rejected: {
        label: "Rejected",
        bg: "bg-red-100",
        text: "text-red-700",
        icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
        ),
    },
    pledged: {
        label: "Pledged",
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
        ),
    },
};

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
    const config = (statusConfig as any)[status] || statusConfig.pending;

    return (
        <span
            className={`
        inline-flex items-center gap-1.5 px-3 py-1.5
        text-xs font-semibold rounded-lg
        ${config.bg} ${config.text}
        ${className}
      `}
        >
            <span>{config.icon}</span>
            {config.label}
        </span>
    );
}
