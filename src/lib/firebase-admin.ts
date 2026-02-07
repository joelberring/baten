import { initializeApp, getApps, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!getApps().length) {
    adminApp = initializeApp({
        projectId: projectId,
    });
} else {
    adminApp = getApps()[0];
}

const adminDb = getFirestore(adminApp);

export { adminApp, adminDb };
