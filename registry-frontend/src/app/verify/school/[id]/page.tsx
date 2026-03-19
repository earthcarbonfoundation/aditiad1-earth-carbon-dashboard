"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getSchoolByRegistryId } from "@/lib/schoolFirestoreService";
import { School } from "@/types/school";
import VerificationBadge from "@/components/VerificationBadge";
import QRCode from "@/components/QRCode";
import Spinner from "@/components/ui/Spinner";
import PublicShell from "@/components/PublicShell";
import Link from "next/link";
import { APP_URL } from "@/lib/constants";

export default function SchoolVerifyPage() {
    const params = useParams();
    const registryId = params.id as string;
    const [school, setSchool] = useState<School | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function fetchSchool() {
            setLoading(true);
            try {
                const data = await getSchoolByRegistryId(registryId);
                if (data) {
                    setSchool(data);
                } else {
                    setNotFound(true);
                }
            } catch (err) {
                console.error(err);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        }
        if (registryId) fetchSchool();
    }, [registryId]);

    if (loading) return <PublicShell><div className="flex justify-center py-20"><Spinner size="lg" /></div></PublicShell>;

    if (notFound || !school) {
        return (
            <PublicShell>
                <div className="max-w-2xl mx-auto text-center py-20">
                    <h1 className="text-3xl font-black text-gray-800 mb-4">School Not Found</h1>
                    <p className="text-gray-500">No school found with Registry ID: <span className="font-mono font-bold">{registryId}</span></p>
                    <Link href="/" className="inline-block mt-8 text-[rgb(32,38,130)] font-bold hover:underline">
                        Return to homepage
                    </Link>
                </div>
            </PublicShell>
        );
    }

    const tco2e = school.tco2e_annual != null ? school.tco2e_annual.toFixed(2) : "N/A";
    const intensity = school.carbon_intensity != null ? school.carbon_intensity.toFixed(2) : "N/A";
    const verifyUrl = `${APP_URL}/verify/school/${school.registryId}`;
    const shareText = `Check out ${school.schoolName}'s climate action on the Earth Carbon Registry: ${verifyUrl}`;

    return (
        <PublicShell>
            <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4 sm:px-0">
                <div className="text-center space-y-4">
                    <div className="inline-block px-4 py-1.5 bg-green-50 rounded-full text-green-700 text-[10px] font-black uppercase tracking-widest mb-2">
                        CLIMATE ASSET REGISTRY • SCHOOL MODULE
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                        {school.schoolName}
                    </h1>
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-lg font-mono font-bold text-[rgb(32,38,130)]">
                            {school.registryId}
                        </p>
                        <VerificationBadge status={school.status} />
                    </div>
                </div>

                {/* Primary Impact Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ImpactCard 
                        label="Annual climate impact" 
                        value={`-${tco2e}`} 
                        unit="tCO2e" 
                        color="bg-[rgb(32,38,130)]" 
                        description="Total annual GHG reduction claim."
                    />
                    <ImpactCard 
                        label="Atmanirbhar Index" 
                        value={`${school.atmanirbhar_pct || 0}%`} 
                        unit="Renewable" 
                        color="bg-orange-500" 
                        description="Portion of energy from renewable sources."
                    />
                    <ImpactCard 
                        label="Circularity Score" 
                        value={`${school.circularity_pct || 0}%`} 
                        unit="Diverted" 
                        color="bg-teal-500" 
                        description="Portion of waste diverted from landfill."
                    />
                </div>

                {/* Efficiency Indicator */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-1 text-center sm:text-left">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Carbon Intensity</h3>
                        <p className="text-gray-500 text-sm font-medium italic">Emissions per student per year</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-gray-900">{intensity}</span>
                        <span className="text-sm font-bold text-gray-400">tCO₂e / student</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Details section */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden h-full">
                            <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100">
                                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">School Particulars</h2>
                            </div>
                            <div className="p-8 space-y-6">
                                <DetailItem label="Location" value={`${school.address}, ${school.city} - ${school.pincode}`} />
                                {school.lat && school.lng && (
                                    <a 
                                        href={`https://www.google.com/maps?q=${school.lat},${school.lng}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-xs font-bold text-[rgb(32,38,130)] hover:underline"
                                    >
                                        📍 View on Geo-Map
                                    </a>
                                )}
                                <div className="grid grid-cols-2 gap-6">
                                    <DetailItem label="Contact Person" value={school.contactPerson} />
                                    <DetailItem label="Verified At" value={school.verifiedAt ? new Date(school.verifiedAt).toLocaleDateString() : "Pending"} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* QR & Verification Artifacts */}
                    <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white space-y-8 flex flex-col justify-between">
                        <div>
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Verification Registry</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-gray-600 uppercase">SHA-256 Fingerprint</span>
                                    <div className="font-mono text-[10px] break-all bg-white/5 p-4 rounded-xl border border-white/10 text-gray-400">
                                        {school.sha256Hash}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-8 pt-4">
                            <QRCode registryId={school.registryId} size={150} />
                            <div className="space-y-6 w-full">
                                <p className="text-sm font-medium text-gray-400 italic">
                                    "This digital registry entry validates this school's climate commitment for the reporting year."
                                </p>
                                <div className="flex gap-3">
                                    <ShareButton platform="wa" text={shareText} url={verifyUrl} />
                                    <ShareButton platform="li" text={shareText} url={verifyUrl} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8">
                    <Link href="https://climateassetregistry.org" className="text-sm font-bold text-gray-400 hover:text-[rgb(32,38,130)] transition-colors">
                        ← Back to Climate Asset Registry
                    </Link>
                </div>
            </div>
        </PublicShell>
    );
}

function ImpactCard({ label, value, unit, color, description }: any) {
    return (
        <div className={`${color} rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-900/10 h-full flex flex-col justify-between`}>
            <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">{label}</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black">{value}</span>
                    <span className="text-sm font-bold opacity-80">{unit}</span>
                </div>
            </div>
            <p className="text-[10px] font-medium mt-4 opacity-70 leading-relaxed uppercase tracking-wider italic">
                {description}
            </p>
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

function ShareButton({ platform, text, url }: any) {
    const isWA = platform === "wa";
    const href = isWA 
        ? `https://wa.me/?text=${encodeURIComponent(text)}`
        : `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
    
    return (
        <a 
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black transition-all ${
                isWA ? "bg-[#25D366] text-white hover:bg-[#20bd5c] shadow-lg shadow-green-500/20" : "bg-[#0A66C2] text-white hover:bg-[#09529d] shadow-lg shadow-blue-500/20"
            }`}
        >
            {isWA ? "WhatsApp Share" : "LinkedIn Share"}
        </a>
    );
}

