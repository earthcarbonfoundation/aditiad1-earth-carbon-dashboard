import { Timestamp } from "firebase/firestore";

export interface Institution {
    id: string;
    userId: string;
    name: string;
    actorType: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    lat: number | null;
    lng: number | null;
    googleMapsPin: string;
    pipelineStatus: string;
    sourceSegment: string;
    totalActions: number;
    totalTco2e: number;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

export interface InstitutionFormData {
    name: string;
    actorType: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    lat: number | null;
    lng: number | null;
    googleMapsPin: string;
    pipelineStatus: string;
    sourceSegment: string;
}
