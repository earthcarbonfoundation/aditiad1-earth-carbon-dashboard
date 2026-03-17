"use client";

import React, { useRef, useState } from "react";
import Spinner from "../ui/Spinner";

interface PhotoUploadSectionProps {
    meterPhotos: string[];
    sitePhoto: string | null;
    userId: string;
    onMeterPhotosChange: (urls: string[]) => void;
    onSitePhotoChange: (url: string | null) => void;
}

async function uploadViaProxy(file: File, path: string): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", path);

    const response = await fetch("/api/storage-proxy", {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
    }

    const data = await response.json();
    return data.url;
}

export default function PhotoUploadSection({
    meterPhotos,
    sitePhoto,
    userId,
    onMeterPhotosChange,
    onSitePhotoChange,
}: PhotoUploadSectionProps) {
    const [uploading, setUploading] = useState<Record<string, boolean>>({});
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const meterRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
    ];
    const siteRef = useRef<HTMLInputElement>(null);

    const handleMeterUpload = async (index: number, file: File) => {
        const key = `meter-${index}`;
        setUploading((prev) => ({ ...prev, [key]: true }));
        try {
            const path = `actions/${userId}/meter-${index}-${Date.now()}-${file.name}`;
            const url = await uploadViaProxy(file, path);
            const updated = [...meterPhotos];
            updated[index] = url;
            onMeterPhotosChange(updated);
        } catch {
            // upload failed silently
        } finally {
            setUploading((prev) => ({ ...prev, [key]: false }));
        }
    };

    const handleSiteUpload = async (file: File) => {
        setUploading((prev) => ({ ...prev, site: true }));
        try {
            const path = `actions/${userId}/site-${Date.now()}-${file.name}`;
            const url = await uploadViaProxy(file, path);
            onSitePhotoChange(url);
        } catch {
            // upload failed silently
        } finally {
            setUploading((prev) => ({ ...prev, site: false }));
        }
    };

    const clearMeterPhoto = (index: number) => {
        const updated = [...meterPhotos];
        updated[index] = "";
        onMeterPhotosChange(updated);
        // Reset the file input so re-uploading the same file works
        if (meterRefs[index]?.current) {
            meterRefs[index].current!.value = "";
        }
    };

    const clearSitePhoto = () => {
        onSitePhotoChange(null);
        if (siteRef.current) {
            siteRef.current.value = "";
        }
    };

    return (
        <>
            <div className="space-y-4">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Photos
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[0, 1, 2].map((index) => (
                        <div key={index} className="space-y-1">
                            <span className="text-xs text-gray-500 font-medium ml-1">
                                Meter Photo {index + 1}
                            </span>
                            <div className="relative h-28 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 overflow-hidden">
                                {uploading[`meter-${index}`] ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Spinner size="sm" />
                                    </div>
                                ) : meterPhotos[index] ? (
                                    <>
                                        <img
                                            src={meterPhotos[index]}
                                            alt={`Meter ${index + 1}`}
                                            className="w-full h-full object-cover cursor-pointer"
                                            onClick={() => setPreviewUrl(meterPhotos[index])}
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearMeterPhoto(index);
                                            }}
                                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                                            aria-label="Remove photo"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </>
                                ) : (
                                    <div
                                        onClick={() => meterRefs[index]?.current?.click()}
                                        className="flex items-center justify-center h-full hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer"
                                    >
                                        <span className="text-gray-400 text-xs">+ Upload</span>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={meterRefs[index]}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                aria-label="Upload meter photo"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleMeterUpload(index, file);
                                }}
                            />
                        </div>
                    ))}
                </div>

                <div className="space-y-1">
                    <span className="text-xs text-gray-500 font-medium ml-1">
                        Site Photo
                    </span>
                    <div className="relative h-28 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 overflow-hidden max-w-[200px]">
                        {uploading.site ? (
                            <div className="flex items-center justify-center h-full">
                                <Spinner size="sm" />
                            </div>
                        ) : sitePhoto ? (
                            <>
                                <img
                                    src={sitePhoto}
                                    alt="Site"
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => setPreviewUrl(sitePhoto)}
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        clearSitePhoto();
                                    }}
                                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                                    aria-label="Remove photo"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <div
                                onClick={() => siteRef.current?.click()}
                                className="flex items-center justify-center h-full hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer"
                            >
                                <span className="text-gray-400 text-xs">+ Upload</span>
                            </div>
                        )}
                    </div>
                    <input
                        ref={siteRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        aria-label="Upload site photo"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSiteUpload(file);
                        }}
                    />
                </div>
            </div>

            {/* Full-screen Preview Modal */}
            {previewUrl && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setPreviewUrl(null)}
                >
                    <button
                        type="button"
                        onClick={() => setPreviewUrl(null)}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer z-10"
                        aria-label="Close preview"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}
