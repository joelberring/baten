"use client";

import { MessageSquare, Calendar, User, Trash2 } from "lucide-react";
import styles from "./expenses.module.css";

export default function ExpenseItem({ expense, onDelete, currentUserName }: { expense: any, onDelete?: (id: string, payer: string) => void, currentUserName?: string }) {
    const canDelete = currentUserName && (expense.payerName === currentUserName || currentUserName.includes("Joel"));
    return (
        <div className={`${styles.item} glass`}>
            <div className={styles.mainInfo}>
                <div className={styles.desc}>
                    <h3>{expense.description}</h3>
                    <span className={styles.category}>{expense.category}</span>
                </div>
                <div className={styles.amount}>
                    {expense.amount} SEK
                </div>
            </div>

            <div className={styles.meta}>
                <div className={styles.metaLeft}>
                    <span><User size={14} /> {expense.payerName}</span>
                    <span><Calendar size={14} /> {expense.date}</span>
                </div>
                <div className={styles.metaRight}>
                    <div className={styles.comments}>
                        <MessageSquare size={14} /> {expense.commentCount || 0}
                    </div>
                    {canDelete && onDelete && (
                        <button onClick={() => onDelete(expense.id, expense.payerName)} className={styles.deleteBtn}>
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
