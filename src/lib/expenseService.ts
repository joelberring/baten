import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    orderBy,
    Timestamp
} from "firebase/firestore";
import { db } from "./firebase";

export interface Expense {
    id?: string;
    description: string;
    amount: number;
    category: string;
    payerName: string;
    date: string;
    year: string;
    participants?: string[];
    receiptUrl?: string;
    createdAt: Timestamp;
}

export interface Payment {
    id?: string;
    from: string;
    to: string;
    amount: number;
    date: string;
    year: string;
    description: string;
    status: string;
    createdAt: Timestamp;
}

const EXPENSES_COLLECTION = "expenses";
const PAYMENTS_COLLECTION = "payments";

export const saveExpense = async (expense: Omit<Expense, "id" | "createdAt" | "year">) => {
    const year = expense.date.split("-")[0];
    return addDoc(collection(db, EXPENSES_COLLECTION), {
        ...expense,
        year,
        createdAt: Timestamp.now(),
    });
};

export const getExpenses = async (year: string) => {
    const q = year === "all"
        ? query(collection(db, EXPENSES_COLLECTION), orderBy("date", "desc"))
        : query(collection(db, EXPENSES_COLLECTION), where("year", "==", year), orderBy("date", "desc"));

    try {
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Expense[];
        console.log(`Fetched ${data.length} expenses for year: ${year}`);
        return data;
    } catch (error) {
        console.error("Error in getExpenses:", error);
        throw error;
    }
};

export const deleteExpense = async (id: string) => {
    return deleteDoc(doc(db, EXPENSES_COLLECTION, id));
};

export const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const { updateDoc } = await import("firebase/firestore");
    return updateDoc(doc(db, EXPENSES_COLLECTION, id), updates);
};

export const saveMultipleExpenses = async (expenses: Omit<Expense, "id" | "createdAt" | "year">[]) => {
    const promises = expenses.map(e => saveExpense(e));
    return Promise.all(promises);
};

export const savePayment = async (payment: Omit<Payment, "id" | "createdAt" | "year">) => {
    const year = payment.date.split("-")[0];
    return addDoc(collection(db, PAYMENTS_COLLECTION), {
        ...payment,
        year,
        createdAt: Timestamp.now(),
    });
};

export const getPayments = async (year: string) => {
    const q = year === "all"
        ? query(collection(db, PAYMENTS_COLLECTION), orderBy("date", "desc"))
        : query(collection(db, PAYMENTS_COLLECTION), where("year", "==", year), orderBy("date", "desc"));

    try {
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Payment[];
        console.log(`Fetched ${data.length} payments for year: ${year}`);
        return data;
    } catch (error) {
        console.error("Error in getPayments:", error);
        throw error;
    }
};

export const deletePayment = async (id: string) => {
    return deleteDoc(doc(db, PAYMENTS_COLLECTION, id));
};

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export const uploadReceipt = async (file: File) => {
    const storageRef = ref(storage, `receipts/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
};
