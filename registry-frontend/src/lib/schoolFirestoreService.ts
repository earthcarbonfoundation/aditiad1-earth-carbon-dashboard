import {
    collection,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    serverTimestamp,
    onSnapshot,
    Unsubscribe
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { School } from "@/types/school";
import { haversineDistance, normalizeSchoolName } from "./schoolUtils";

const SCHOOL_COLLECTION = "schools";
const BASELINE_COLLECTION = "schoolBaselines";
const PROJECT_COLLECTION = "projects";

export async function getSchoolByRegistryId(registryId: string): Promise<School | null> {
    const q = query(
        collection(db, SCHOOL_COLLECTION),
        where("registryId", "==", registryId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const schoolDoc = snap.docs[0];
    
    // Fetch baseline data too
    const baselineSnap = await getDoc(doc(db, BASELINE_COLLECTION, schoolDoc.id));
    const baselineData = baselineSnap.exists() ? baselineSnap.data() : {};
    
    return { id: schoolDoc.id, ...schoolDoc.data(), ...baselineData } as School;
}

export async function checkDuplicateSchool(place_id: string, schoolName: string, lat: number, lng: number): Promise<{ isDuplicate: boolean; registryId?: string; type?: 'BLOCK' | 'WARNING' }> {
    // Step 1: Place ID Check
    if (place_id) {
        const qPlace = query(collection(db, SCHOOL_COLLECTION), where("place_id", "==", place_id));
        const snapPlace = await getDocs(qPlace);
        if (!snapPlace.empty) {
            return { isDuplicate: true, registryId: snapPlace.docs[0].data().registryId, type: 'BLOCK' };
        }
    }

    // Step 2 & 3: Normalized Name + Geo Distance Check
    const normalized = normalizeSchoolName(schoolName);
    const qName = query(collection(db, SCHOOL_COLLECTION), where("name_normalized", "==", normalized));
    const snapName = await getDocs(qName);
    
    for (const d of snapName.docs) {
        const data = d.data();
        const distance = haversineDistance(lat, lng, data.lat, data.lng);
        if (distance < 500) {
            return { isDuplicate: true, registryId: data.registryId, type: 'BLOCK' };
        } else {
            return { isDuplicate: true, registryId: data.registryId, type: 'WARNING' };
        }
    }

    return { isDuplicate: false };
}

export async function getProjects() {
    try {
        const q = query(collection(db, PROJECT_COLLECTION), orderBy("name"));
        const snap = await getDocs(q);
        if (snap.empty) {
            return [{ id: "proj-default", name: "General Carbon Registry Project" }];
        }
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("Error fetching projects:", error);
        return [{ id: "proj-default", name: "General Carbon Registry Project" }];
    }
}

export async function getSchoolActions(projectId: string) {
    try {
        const q = query(collection(db, "schoolActionsList"), where("projectId", "==", projectId));
        const snap = await getDocs(q);
        if (snap.empty) {
            return [
                { id: "ACT-001", type: "Solar Installation" },
                { id: "ACT-002", type: "Tree Plantation" },
                { id: "ACT-003", type: "Waste Management" }
            ];
        }
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("Error fetching actions:", error);
        return [
            { id: "ACT-001", type: "Solar Installation" },
            { id: "ACT-002", type: "Tree Plantation" }
        ];
    }
}

export function getAllSchoolsRealtime(
    onUpdate: (schools: School[]) => void,
    onError?: (error: any) => void,
    limitCount: number = 50
): Unsubscribe {
    const q = query(
        collection(db, SCHOOL_COLLECTION)
    );

    return onSnapshot(q, async (snapshot) => {
        const schools = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
        })) as School[];
        onUpdate(schools);
    }, (error) => {
        console.error("Firestore Error:", error);
        onError?.(error);
    });
}

