import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const EXPENSES_COLLECTION = "expenses";
const PAYMENTS_COLLECTION = "payments";

async function wipe() {
    console.log("Starting wipe...");

    // Wipe Expenses
    const expSnap = await getDocs(collection(db, EXPENSES_COLLECTION));
    console.log(`Found ${expSnap.size} expenses to delete.`);
    for (const d of expSnap.docs) {
        await deleteDoc(doc(db, EXPENSES_COLLECTION, d.id));
    }

    // Wipe Payments
    const paySnap = await getDocs(collection(db, PAYMENTS_COLLECTION));
    console.log(`Found ${paySnap.size} payments to delete.`);
    for (const d of paySnap.docs) {
        await deleteDoc(doc(db, PAYMENTS_COLLECTION, d.id));
    }

    console.log("Wipe complete!");
}

wipe().catch(console.error);
