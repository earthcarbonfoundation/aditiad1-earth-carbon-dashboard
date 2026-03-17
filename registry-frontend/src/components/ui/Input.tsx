"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className = "", id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

        return (
            <div className="space-y-2">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`
            w-full px-5 py-4 rounded-xl border bg-gray-50/50
            focus:bg-white transition-all duration-200 outline-none
            font-medium text-gray-700 placeholder:text-gray-300
            ${error ? "border-red-400 focus:border-red-400" : "border-gray-100 focus:border-blue-400"}
            ${className}
          `}
                    {...props}
                />
                {error && <p className="text-red-500 text-xs ml-1">{error}</p>}
                {helperText && !error && (
                    <p className="text-gray-400 text-xs ml-1">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
export default Input;
