import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import * as dotenv from "dotenv";

dotenv.config();

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
