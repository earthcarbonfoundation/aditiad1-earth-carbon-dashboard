"use client";

import React from "react";

interface CardProps {
    header?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

export default function Card({
    header,
    children,
    className = "",
    noPadding = false,
}: CardProps) {
    return (
        <div
            className={`
        bg-white rounded-[2rem] border border-gray-100
        shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        ${className}
      `}
        >
            {header && (
                <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                    {header}
                </div>
            )}
            <div className={noPadding ? "" : "px-8 py-8"}>{children}</div>
        </div>
    );
}
