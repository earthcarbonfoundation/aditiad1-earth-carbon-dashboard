"use client";

import React from "react";
import RegisterActionForm from "@/components/RegisterActionForm";

export default function RegisterPage() {
    return (
        <div className="min-h-[calc(100vh-82px)] bg-gray-50 px-4 md:px-8 py-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                        Register New Action
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Fill in the details below to register your carbon action. A ₹1 registration fee applies.
                    </p>
                </div>

                <RegisterActionForm />
            </div>
        </div>
    );
}
