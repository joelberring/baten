import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function listData() {
    console.log("Checking database for project:", firebaseConfig.projectId);

    console.log("\n--- EXPENSES ---");
    const expSnap = await getDocs(collection(db, "expenses"));
    console.log(`Total expenses: ${expSnap.size}`);
    expSnap.forEach(doc => {
        const data = doc.data();
        console.log(`[${doc.id}] Year: ${data.year}, Date: ${data.date}, Desc: ${data.description}, Payer: ${data.payerName}`);
    });

    console.log("\n--- PAYMENTS ---");
    const paySnap = await getDocs(collection(db, "payments"));
    console.log(`Total payments: ${paySnap.size}`);
    paySnap.forEach(doc => {
        const data = doc.data();
        console.log(`[${doc.id}] Year: ${data.year}, Date: ${data.date}, From: ${data.from}, To: ${data.to}`);
    });
}

listData().catch(console.error);
