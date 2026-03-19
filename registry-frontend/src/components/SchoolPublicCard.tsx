"use client";

import React from "react";
import { School } from "@/types/school";
import VerificationBadge from "@/components/VerificationBadge";
import QRCode from "@/components/QRCode";

interface SchoolPublicCardProps {
    school: School;
}

export default function SchoolPublicCard({ school }: SchoolPublicCardProps) {
    const tco2e = school.tco2e_annual != null ? school.tco2e_annual.toFixed(3) : "N/A";

    return (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
            <div className="p-8 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="space-y-2">
                        <VerificationBadge status={school.status} />
                        <h2 className="text-3xl font-black text-gray-800 tracking-tight">{school.schoolName}</h2>
                        <p className="text-sm font-mono font-bold text-[rgb(32,38,130)]">{school.registryId}</p>
                    </div>
                    <div className="bg-green-50 px-6 py-4 rounded-3xl border border-green-100 text-center">
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Impact Reduction</p>
                        <p className="text-3xl font-black text-green-700">-{tco2e} <span className="text-sm">tCO₂e</span></p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
                    <div className="space-y-4">
                        <DetailItem label="Location" value={school.address} />
                        <DetailItem label="Pincode" value={school.pincode} />
                        <DetailItem label="Contact Person" value={school.contactPerson} />
                    </div>
                    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-[2rem]">
                        <QRCode registryId={school.registryId} size={120} />
                        <p className="text-[10px] font-bold text-gray-400 mt-4 uppercase">Scan to Verify</p>
                    </div>
                </div>
            </div>
            <div className="bg-[rgb(32,38,130)] px-8 py-4 flex justify-between items-center">
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Earth Carbon Registry • {new Date().getFullYear()}</span>
                <span className="text-[10px] font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Verified Climate Action
                </span>
            </div>
        </div>
    );
}

function DetailItem({ label, value }: any) {
    return (
        <div className="space-y-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
            <p className="text-sm font-bold text-gray-700 leading-relaxed">{value || "N/A"}</p>
        </div>
    );
}
