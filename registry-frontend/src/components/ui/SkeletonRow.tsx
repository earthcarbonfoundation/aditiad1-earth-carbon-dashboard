"use client";

import React from "react";

interface SkeletonRowProps {
    columns?: number;
}

export default function SkeletonRow({ columns = 5 }: SkeletonRowProps) {
    return (
        <div className="animate-pulse">
            {[...Array(3)].map((_, rowIdx) => (
                <div
                    key={rowIdx}
                    className="grid gap-4 py-5 px-6 border-b border-gray-50"
                    style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
                >
                    {[...Array(columns)].map((_, colIdx) => (
                        <div
                            key={colIdx}
                            className="h-4 bg-gray-200 rounded-lg"
                            style={{ width: `${60 + Math.random() * 30}%` }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
