"use client";

import React from "react";
import { ACTION_TYPES } from "@/lib/constants";
import CustomDropdown from "../ui/CustomDropdown";

interface ActionTypeSelectorProps {
    value: string;
    unitValue: string;
    onChange: (val: string) => void;
    onUnitChange: (unit: string) => void;
    error?: string;
    touched?: boolean;
}

export default function ActionTypeSelector({
    value,
    unitValue,
    onChange,
    onUnitChange,
    error,
    touched,
}: ActionTypeSelectorProps) {
    const handleDropdownChange = (val: string) => {
        onChange(val);
        const selected = ACTION_TYPES.find((t) => t.value === val);
        if (selected) {
            onUnitChange(selected.unit);
        }
    };

    return (
        <div className="space-y-2">
            <label
                htmlFor="actionType"
                className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1"
            >
                Action Type
            </label>
            <CustomDropdown
                size="lg"
                value={value}
                onChange={handleDropdownChange}
                options={ACTION_TYPES.map((type) => ({ value: type.value, label: type.label }))}
                placeholder="Select an action"
                className={touched && error ? "ring-1 ring-red-400 rounded-xl" : ""}
            />
            {touched && error && (
                <p className="text-red-500 text-xs ml-1">{error}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Unit:
                </span>
                <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg">
                    {unitValue || "—"}
                </span>
            </div>
        </div>
    );
}
