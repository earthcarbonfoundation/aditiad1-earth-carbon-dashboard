"use client";

import React from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                    <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-red-500"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>

                <div>
                    <h1 className="text-2xl font-black text-gray-800 mb-2">
                        Something went wrong
                    </h1>
                    <p className="text-sm text-gray-500">
                        An unexpected error occurred. Please try again or contact support if the issue persists.
                    </p>
                </div>

                {error?.message && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-left">
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">
                            Error Details
                        </p>
                        <p className="text-sm text-red-600 font-mono break-all">
                            {error.message}
                        </p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-[rgb(32,38,130)] text-white font-bold text-sm rounded-xl hover:bg-[rgb(25,30,110)] transition-colors cursor-pointer"
                    >
                        Try Again
                    </button>
                    <a
                        href="/"
                        className="px-6 py-3 bg-gray-100 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors no-underline"
                    >
                        Go Home
                    </a>
                </div>
            </div>
        </div>
    );
}
