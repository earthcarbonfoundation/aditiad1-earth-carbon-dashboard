import { Timestamp } from "firebase/firestore";

export type ActionStatus = "pending" | "verified" | "rejected";
export type ActorType = "individual" | "organization" | "government" | "ngo";

export interface Action {
    id: string;
    registryId: string;
    institutionId: string | null;
    actionType: string;
    quantity: number;
    unit: string;
    address: string;
    lat: number | null;
    lng: number | null;
    userId: string;
    userEmail: string;
    actorType: ActorType;
    actorName: string;
    contactPerson: string;
    phone: string;
    email: string;
    status: ActionStatus;
    co2eKg: number | null;
    atmanirbharPercent: number | null;
    sha256Hash: string;
    meterPhotos: string[];
    sitePhoto: string | null;
    commissioningDate: string | null;
    localPercent: number | null;
    indigenousPercent: number | null;
    communityPercent: number | null;
    jobsCreated: number | null;
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
    verifiedAt?: string | null;
    verifiedBy?: string | null;
    adminNotes?: string | null;
    calculationVersion?: string | null;
    calculationMethodology?: string | null;
    emissionFactorUsed?: string | null;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

export interface ActionFormData {
    actionType: string;
    quantity: number | string;
    unit: string;
    address: string;
    lat: number | null;
    lng: number | null;
    actorType: ActorType;
    actorName: string;
    contactPerson: string;
    phone: string;
    email: string;
    meterPhotos: string[];
    sitePhoto: string | null;
    commissioningDate: string;
    localPercent: number | string;
    indigenousPercent: number | string;
    communityPercent: number | string;
    jobsCreated: number | string;
    consentGiven: boolean;
    disclaimerAccepted: boolean;
}
