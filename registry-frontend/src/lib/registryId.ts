import { db } from "./firebaseConfig";
import { doc, runTransaction } from "firebase/firestore";

export async function generateRegistryId(): Promise<string> {
    const counterRef = doc(db, "meta", "registryCounter");

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
