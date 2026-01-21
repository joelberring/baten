export interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
}

export interface Expense {
    id: string;
    description: string;
    amount: number;
    date: Date;
    payerId: string;
    groupId: string;
    category: "Underhåll" | "Bränsle" | "Hamnavgift" | "Mat" | "Övrigt";
    splits: ExpenseSplit[];
    comments: Comment[];
}

export interface ExpenseSplit {
    id: string;
    expenseId: string;
    userId: string;
    amount: number;
}

export interface Comment {
    id: string;
    expenseId: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: Date;
}

export interface Payment {
    id: string;
    from_user_id: string;
    to_user_id: string;
    from_user_name: string;
    to_user_name: string;
    amount: number;
    date: Date;
    status: "Slutförd" | "Väntande";
}

export interface Balance {
    userId: string;
    userName: string;
    amount: number; // Positive means "owed", negative means "owes"
}
