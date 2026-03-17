import { initializeApp, getApps, App, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp(): App {
    if (getApps().length > 0) return getApps()[0];

    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    const hasValidCredentials =
        privateKey &&
        clientEmail &&
        projectId &&
        privateKey.includes("BEGIN PRIVATE KEY");

    if (hasValidCredentials) {
        return initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, "\n"),
            }),
        });
    }

    return initializeApp({ projectId });
}

const adminApp = getAdminApp();
export const adminDb = getFirestore(adminApp, "asia-pacific");
