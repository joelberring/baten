"use client";

import { Image as ImageIcon, Trash2, Users } from "lucide-react";
import styles from "./expenses.module.css";

import { Expense } from "@/lib/expenseService";

export default function ExpenseItem({ expense, onDelete, onUpdate, currentUserName }: { expense: Expense, onDelete?: (id: string, payer: string) => void, onUpdate?: (id: string, updates: Partial<Expense>) => void, currentUserName?: string }) {
    const canDelete = currentUserName && (expense.payerName === currentUserName || currentUserName.includes("Joel"));
    const participantCount = expense.participants ? expense.participants.length : 3; // Default to 3 if legacy

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (onUpdate && expense.id) {
            onUpdate(expense.id, { category: e.target.value as Expense['category'] });
        }
    };

    // Determine if amount should be orange (if I paid, or if I'm involved)
    // For simplicity in feed: Orange = high visibility/action color
    const isPayer = expense.payerName === currentUserName;

    return (
        <div className={styles.item}>
            <div className={styles.header}>
                <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                        {expense.payerName ? expense.payerName.split(' ')[0][0] : '?'}
                    </div>
                    <div className={styles.metaInfo}>
                        <span className={styles.userName}>{expense.payerName}</span>
                        <span className={styles.date}>{expense.date}</span>
                    </div>
                </div>
                <div className={`${styles.amount} ${isPayer ? styles.orange : ''}`}>
                    {Math.round(expense.amount)} kr
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.description}>{expense.description}</div>
                <select
                    className={styles.categorySelect}
                    value={expense.category}
                    onChange={handleCategoryChange}
                >
                    <option value="Mat">Mat & Dryck</option>
                    <option value="Hamnavgift">Hamnavgift</option>
                    <option value="Bränsle">Bränsle</option>
                    <option value="Underhåll">Underhåll & Fix</option>
                    <option value="Försäkring">Försäkring</option>
                    <option value="Övrigt">Övrigt</option>
                </select>
            </div>

            <div className={styles.footer}>
                <div className={styles.splitInfo}>
                    <Users size={14} /> Delas med {participantCount}
                </div>
                <div className={styles.actions}>
                    {expense.receiptUrl && (
                        <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" className={styles.iconBtn}>
                            <ImageIcon size={16} />
                        </a>
                    )}
                    {canDelete && onDelete && (
                        <button onClick={() => onDelete(expense.id!, expense.payerName!)} className={`${styles.iconBtn} ${styles.deleteBtn}`}>
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
