import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";

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

async function addMissingPayment() {
    console.log("Adding missing Joel -> Samuel payment...");

    await addDoc(collection(db, "payments"), {
        from: "Joel Berring",
        to: "Samuel Lundqvist",
        amount: 7720,
        date: "2025-05-31",
        description: "Betalning för båtinköp",
        status: "Slutförd",
        year: "2025",
        createdAt: Timestamp.now()
    });

    console.log("Payment added successfully!");
}

addMissingPayment().catch(console.error);
