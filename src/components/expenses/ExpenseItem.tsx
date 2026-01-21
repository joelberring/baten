"use client";

import { MessageSquare, Calendar, User } from "lucide-react";
import styles from "./expenses.module.css";

export default function ExpenseItem({ expense }: { expense: any }) {
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
                <div className={styles.comments}>
                    <MessageSquare size={14} /> {expense.commentCount || 0} kommentarer
                </div>
            </div>
        </div>
    );
}
