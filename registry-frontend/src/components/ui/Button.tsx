"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        "bg-[rgb(32,38,130)] text-white border-[rgb(32,38,130)] hover:bg-[rgb(25,30,110)] hover:-translate-y-0.5 shadow-sm",
    secondary:
        "bg-white text-[rgb(32,38,130)] border-[rgb(32,38,130)] hover:bg-blue-50",
    danger:
        "bg-red-500 text-white border-red-500 hover:bg-red-600 shadow-lg shadow-red-200",
    ghost:
        "bg-transparent text-gray-600 border-transparent hover:bg-gray-50",
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "py-2 px-4 text-xs rounded-lg",
    md: "py-3 px-6 text-sm rounded-xl",
    lg: "py-4 px-8 text-base rounded-xl",
};

export default function Button({
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    children,
    className = "",
    ...props
}: ButtonProps) {
    return (
        <button
            disabled={disabled || loading}
            className={`
        inline-flex items-center justify-center gap-2
        font-semibold border
        transition-all duration-200 active:scale-[0.98]
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
            {...props}
        >
            {loading && (
                <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            )}
            {children}
        </button>
    );
}
