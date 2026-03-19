import React from "react";

export default function NotFound() {
    return (
        <div className="min-h-[calc(100vh-82px)] bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                </div>

                <div>
                    <h1 className="text-5xl font-black text-gray-800 mb-2">404</h1>
                    <p className="text-lg font-bold text-gray-600 mb-1">
                        Page Not Found
                    </p>
                    <p className="text-sm text-gray-400">
                        The page you are looking for does not exist or has been moved.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                        href="/"
                        className="px-6 py-3 bg-[rgb(32,38,130)] text-white font-bold text-sm rounded-xl hover:bg-[rgb(25,30,110)] transition-colors no-underline"
                    >
                        Go Home
                    </a>
                    <a
                        href="/profile"
                        className="px-6 py-3 bg-gray-100 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors no-underline"
                    >
                        Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}
