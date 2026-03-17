"use client";

import React, { useState, useRef, useEffect } from "react";

export interface DropdownOption {
    value: string;
    label: string;
}

export interface CustomDropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    size?: "sm" | "md" | "lg";
}

const sizeClasses = {
    sm: "px-3 py-2 text-xs rounded-lg",
    md: "px-4 py-2.5 text-sm rounded-xl",
    lg: "px-5 py-4 text-base rounded-xl",
};

export default function CustomDropdown({
    options,
    value,
    onChange,
    placeholder = "Select an option",
    className = "",
    disabled = false,
    size = "md",
}: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
        } else if (e.key === "Escape") {
            setIsOpen(false);
        } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
                return;
            }
            const currentIndex = options.findIndex((opt) => opt.value === value);
            const nextIndex =
                e.key === "ArrowDown"
                    ? (currentIndex + 1) % options.length
                    : (currentIndex - 1 + options.length) % options.length;
            onChange(options[nextIndex].value);
        }
    };

    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <button
                type="button"
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                className={`
                    flex items-center justify-between w-full
                    border border-gray-100 bg-gray-50/50 hover:bg-white focus:bg-white focus:border-blue-400
                    transition-all duration-200 outline-none font-medium
                    ${sizeClasses[size]}
                    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
            >
                <span className={`truncate mr-2 ${selectedOption ? "text-gray-700" : "text-gray-400"}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-gray-500 flex-shrink-0 transition-transform duration-150 ${isOpen ? "rotate-180" : "rotate-0"}`}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {isOpen && (
                <div
                    role="listbox"
                    className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 shadow-lg rounded-xl max-h-60 overflow-y-auto"
                >
                    <div className="py-1">
                        {options.map((option) => {
                            const isSelected = option.value === value;
                            return (
                                <div
                                    key={option.value}
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        px-4 py-2.5 flex items-center justify-between cursor-pointer
                                        transition-colors duration-150 hover:bg-gray-50
                                        ${isSelected ? "text-[rgb(32,38,130)] font-semibold bg-blue-50/30" : "text-gray-700"}
                                        ${size === "sm" ? "text-xs px-3 py-2" : size === "lg" ? "text-base px-5" : "text-sm"}
                                    `}
                                >
                                    <span className="truncate pr-4">{option.label}</span>
                                    {isSelected && (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
