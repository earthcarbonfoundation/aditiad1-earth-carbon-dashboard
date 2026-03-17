"use client";

import React, { useCallback } from "react";
import LocationAutocomplete from "../LocationAutocomplete";

interface LocationData {
    address: string;
    lat?: number;
    lng?: number;
}

interface LocationPickerSectionProps {
    address: string;
    lat: number | null;
    lng: number | null;
    onAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPlaceSelect: (location: LocationData) => void;
    onCoordsChange: (lat: number, lng: number) => void;
    error?: string;
    touched?: boolean;
}

export default function LocationPickerSection({
    address,
    lat,
    lng,
    onAddressChange,
    onPlaceSelect,
    onCoordsChange,
    error,
    touched,
}: LocationPickerSectionProps) {
    const handleUseGPS = useCallback(() => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const gpsLat = position.coords.latitude;
                const gpsLng = position.coords.longitude;
                onCoordsChange(gpsLat, gpsLng);

                try {
                    const response = await fetch(
                        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${gpsLat},${gpsLng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
                    );
                    const data = await response.json();
                    if (data.results?.[0]?.formatted_address) {
                        onPlaceSelect({
                            address: data.results[0].formatted_address,
                            lat: gpsLat,
                            lng: gpsLng,
                        });
                    }
                } catch {
                    onPlaceSelect({
                        address: `${gpsLat.toFixed(6)}, ${gpsLng.toFixed(6)}`,
                        lat: gpsLat,
                        lng: gpsLng,
                    });
                }
            },
            () => { }
        );
    }, [onCoordsChange, onPlaceSelect]);

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Location
                </label>
                <LocationAutocomplete
                    value={address}
                    onChange={onAddressChange}
                    onPlaceSelect={onPlaceSelect}
                    placeholder="Start typing an address..."
                    name="address"
                    error={touched && error ? error : undefined}
                />
            </div>

            <button
                type="button"
                onClick={handleUseGPS}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[rgb(32,38,130)] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Use My GPS Location
            </button>

            {lat !== null && lng !== null && (
                <div className="flex items-center gap-2 text-xs text-gray-400 ml-1">
                    <span className="font-medium">Coordinates:</span>
                    <span className="px-2 py-1 bg-gray-50 rounded text-gray-600 font-mono">
                        {lat.toFixed(6)}, {lng.toFixed(6)}
                    </span>
                </div>
            )}
        </div>
    );
}
