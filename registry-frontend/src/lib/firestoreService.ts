import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    runTransaction,
    Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Action, ActionStatus } from "@/types/action";
import { Institution } from "@/types/institution";
import { UserProfile } from "@/types/user";

const COLLECTIONS = {
    USERS: "users",
    ACTIONS: "actions",
    INSTITUTIONS: "institutions",
    META: "meta",
} as const;

export async function createUserProfile(
    profile: Omit<UserProfile, "createdAt">
): Promise<void> {
    await setDoc(doc(db, COLLECTIONS.USERS, profile.uid), {
        ...profile,
        createdAt: serverTimestamp(),
    });
}

export async function getUserProfile(
    uid: string
): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    if (!snap.exists()) return null;
    return { uid: snap.id, ...snap.data() } as UserProfile;
}

export async function updateUserProfile(
    uid: string,
    data: Partial<UserProfile>
): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function createAction(
    action: Omit<Action, "id" | "createdAt">
): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.ACTIONS), {
        ...action,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function getActionById(id: string): Promise<Action | null> {
    const snap = await getDoc(doc(db, COLLECTIONS.ACTIONS, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Action;
}

export async function getActionByRegistryId(
    registryId: string
): Promise<Action | null> {
    const q = query(
        collection(db, COLLECTIONS.ACTIONS),
        where("registryId", "==", registryId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Action;
}

export function getUserActions(
    userId: string,
    onUpdate: (actions: Action[]) => void
): Unsubscribe {
    const q = query(
        collection(db, COLLECTIONS.ACTIONS),
        where("userId", "==", userId)
    );

    return onSnapshot(q, (snapshot) => {
        const actions = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
        })) as Action[];

        actions.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
        });

        onUpdate(actions);
    });
}

export async function getActionsByUserId(userId: string): Promise<Action[]> {
    const q = query(
        collection(db, COLLECTIONS.ACTIONS),
        where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return [];

    const actions = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Action[];
    actions.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
    });
    return actions;
}

export async function updateAction(
    id: string,
    data: Partial<Action>
): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.ACTIONS, id), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function updateActionStatus(
    id: string,
    status: ActionStatus
): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.ACTIONS, id), {
        status,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteAction(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.ACTIONS, id));
}

export async function getAllActions(): Promise<Action[]> {
    const q = query(collection(db, COLLECTIONS.ACTIONS));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Action[];
}

export function getAllActionsRealtime(
    onUpdate: (actions: Action[]) => void
): Unsubscribe {
    const q = query(collection(db, COLLECTIONS.ACTIONS));

    return onSnapshot(q, (snapshot) => {
        const actions = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
        })) as Action[];

        actions.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
        });

        onUpdate(actions);
    });
}

export async function getAllUsers(): Promise<UserProfile[]> {
    const q = query(collection(db, COLLECTIONS.USERS));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() })) as UserProfile[];
}

export async function createInstitution(
    data: Omit<Institution, "id" | "createdAt" | "totalActions" | "totalTco2e">
): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.INSTITUTIONS), {
        ...data,
        totalActions: 0,
        totalTco2e: 0,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function getUserInstitutions(
    userId: string
): Promise<Institution[]> {
    const q = query(
        collection(db, COLLECTIONS.INSTITUTIONS),
        where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Institution[];
}

export async function updateInstitution(
    id: string,
    data: Partial<Institution>
): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.INSTITUTIONS, id), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteInstitution(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.INSTITUTIONS, id));
}

export async function getNextRegistryId(): Promise<string> {
    const counterRef = doc(db, COLLECTIONS.META, "registryCounter");

    const newCount = await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        let current = 0;
        if (counterSnap.exists()) {
            current = counterSnap.data().count || 0;
        }
        const next = current + 1;
        transaction.set(counterRef, { count: next }, { merge: true });
        return next;
    });

    return `ECF-${String(newCount).padStart(4, "0")}`;
}
