"use client";

import React from "react";
import { ACTOR_TYPES } from "@/lib/constants";
import Input from "../ui/Input";

interface ActorDetailsSectionProps {
    actorType: string;
    actorName: string;
    contactPerson: string;
    phone: string;
    email: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
    errors: Record<string, string | undefined>;
    touched: Record<string, boolean | undefined>;
}

export default function ActorDetailsSection({
    actorType,
    actorName,
    contactPerson,
    phone,
    email,
    onChange,
    onBlur,
    errors,
    touched,
}: ActorDetailsSectionProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Actor Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {ACTOR_TYPES.map((type) => (
                        <label
                            key={type.value}
                            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer
                transition-all duration-200
                ${actorType === type.value
                                    ? "border-[rgb(32,38,130)] bg-blue-50/50"
                                    : "border-gray-100 bg-gray-50/50 hover:border-gray-200"
                                }
              `}
                        >
                            <input
                                type="radio"
                                name="actorType"
                                value={type.value}
                                checked={actorType === type.value}
                                onChange={onChange}
                                className="accent-[rgb(32,38,130)]"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                {type.label}
                            </span>
                        </label>
                    ))}
                </div>
                {touched.actorType && errors.actorType && (
                    <p className="text-red-500 text-xs ml-1">{errors.actorType}</p>
                )}
            </div>

            <Input
                label="Actor Name / Organization Name"
                name="actorName"
                value={actorName}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Enter name"
                error={touched.actorName ? errors.actorName : undefined}
            />

            <Input
                label="Contact Person"
                name="contactPerson"
                value={contactPerson}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Full name of contact"
                error={touched.contactPerson ? errors.contactPerson : undefined}
            />

            <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={phone}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="10-digit phone number"
                error={touched.phone ? errors.phone : undefined}
            />

            <Input
                label="Email Address"
                name="email"
                type="email"
                value={email}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="email@example.com"
                error={touched.email ? errors.email : undefined}
            />
        </div>
    );
}
