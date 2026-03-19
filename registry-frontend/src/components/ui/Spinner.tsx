"use client";

import React from "react";

interface SpinnerProps {
    size?: "sm" | "md" | "lg";
    light?: boolean;
    className?: string;
}

const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-4",
    lg: "w-10 h-10 border-4",
};

export default function Spinner({ size = "md", light = false, className = "" }: SpinnerProps) {
    return (
        <div
            className={`
        ${sizeClasses[size]}
        ${light ? "border-white" : "border-[rgb(32,38,130)]"} border-t-transparent
        rounded-full animate-spin
        ${className}
      `}
        />
    );
}
