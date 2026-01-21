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
    createdAt: Timestamp;
}

const EXPENSES_COLLECTION = "expenses";

export const saveExpense = async (expense: Omit<Expense, "id" | "createdAt" | "year">) => {
    const year = expense.date.split("-")[0];
    return addDoc(collection(db, EXPENSES_COLLECTION), {
        ...expense,
        year,
        createdAt: Timestamp.now(),
    });
};

export const getExpenses = async (year: string) => {
    const q = query(
        collection(db, EXPENSES_COLLECTION),
        where("year", "==", year),
        orderBy("date", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Expense[];
};

export const deleteExpense = async (id: string) => {
    return deleteDoc(doc(db, EXPENSES_COLLECTION, id));
};

export const saveMultipleExpenses = async (expenses: Omit<Expense, "id" | "createdAt" | "year">[]) => {
    const promises = expenses.map(e => saveExpense(e));
    return Promise.all(promises);
};
