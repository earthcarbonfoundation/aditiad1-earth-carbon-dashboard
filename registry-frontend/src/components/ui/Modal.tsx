"use client";

import React from "react";
import CloseButtonIcon from "../svg/CloseButtonIcon";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = "max-w-lg",
}: ModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-gray-900/10 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 transition-all duration-300"
            onClick={onClose}
        >
            <div
                className={`bg-white rounded-[2rem] w-full ${maxWidth} shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 duration-300 scale-100 relative max-h-[90vh] flex flex-col`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-gray-100 shrink-0">
                    <h2 className="text-xl font-semibold text-gray-800 tracking-tight">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-300 hover:text-gray-500 cursor-pointer"
                    >
                        <CloseButtonIcon />
                    </button>
                </div>
                <div className="px-8 pt-8 pb-10 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}
