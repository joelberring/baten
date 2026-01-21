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

const expenses = [
    // 2025
    { date: "2025-09-27", description: "Ställning", amount: 3125, category: "Underhåll", payerName: "Joel Berring" },
    { date: "2025-09-27", description: "Fultvätt", amount: 900, category: "Underhåll", payerName: "Joel Berring" },
    { date: "2025-07-01", description: "Tändstift + tändstiftsnyckel", amount: 219, category: "Underhåll", payerName: "Avenir Kobetski" },
    { date: "2025-07-01", description: "Elprylar (3fas-konv + gren...)", amount: 235, category: "Underhåll", payerName: "Avenir Kobetski" },
    { date: "2025-06-04", description: "Bojprylar", amount: 3540, category: "Underhåll", payerName: "Joel Berring" },
    { date: "2025-05-31", description: "Båtklubbsavgift", amount: 8221, category: "Övrigt", payerName: "Samuel Lundqvist" },
    { date: "2025-05-31", description: "Försäkring", amount: 328, category: "Övrigt", payerName: "Samuel Lundqvist" },
    { date: "2025-05-31", description: "Bojankare + vantfästen", amount: 4100, category: "Underhåll", payerName: "Avenir Kobetski" },
    { date: "2025-05-31", description: "Bensindunk + bensin", amount: 204, category: "Bränsle", payerName: "Samuel Lundqvist" },
    { date: "2025-05-31", description: "Ikea kök", amount: 480, category: "Övrigt", payerName: "Joel Berring" },
    { date: "2025-05-31", description: "Biltema + bensin", amount: 1005, category: "Bränsle", payerName: "Joel Berring" },
    { date: "2025-05-31", description: "Sea Sea Segeltorp", amount: 178, category: "Övrigt", payerName: "Joel Berring" },

    // 2024
    { date: "2024-10-31", description: "Segelduk", amount: 1747, category: "Underhåll", payerName: "Joel Berring" },
    { date: "2024-10-31", description: "Vinterförvaring", amount: 4912, category: "Underhåll", payerName: "Samuel Lundqvist" },
    { date: "2024-10-31", description: "Båtinköp", amount: 20000, category: "Övrigt", payerName: "Samuel Lundqvist" },
    { date: "2024-09-27", description: "Köplats", amount: 200, category: "Öbhigt", payerName: "Samuel Lundqvist" },
];

const payments = [
    { from: "Avenir Kobetski", to: "Samuel Lundqvist", amount: 8771.67, date: "2025-06-01", description: "Skuldbetalning (båt...)", status: "Slutförd" },
    { from: "Avenir Kobetski", to: "Joel Berring", amount: 920, date: "2025-05-31", description: "Bet. för segelduk + Biltem...", status: "Slutförd" },
];

async function seed() {
    console.log("Starting seed with Client SDK...");

    for (const exp of expenses) {
        const year = exp.date.split("-")[0];
        await addDoc(collection(db, "expenses"), {
            ...exp,
            year,
            createdAt: Timestamp.now()
        });
        console.log(`Added expense: ${exp.description}`);
    }

    for (const p of payments) {
        const year = p.date.split("-")[0];
        await addDoc(collection(db, "payments"), {
            ...p,
            year,
            createdAt: Timestamp.now()
        });
        console.log(`Added payment: ${p.description}`);
    }

    console.log("Seed complete!");
}

seed().catch(console.error);
