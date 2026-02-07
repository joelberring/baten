"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./excel.module.css";
import { Save, Trash2, Plus, CheckCircle2, Camera, Loader2 } from "lucide-react";
import { saveExpense, updateExpense, deleteExpense, getExpenses, uploadReceipt, Expense } from "@/lib/expenseService";
import { useSession } from "next-auth/react";

const PARTNERS = ["Joel Berring", "Avenir Kobetski", "Samuel Lundqvist"];

interface ExcelRow {
    id: string | number;
    isNew?: boolean;
    date: string;
    description: string;
    amount: string | number;
    category: string;
    payerName: string;
    participants: string[];
    receiptUrl?: string;
}

export default function ExcelMode({ onSave, initialYear }: { onSave?: () => void, initialYear?: string }) {
    const { data: session } = useSession();
    const [rows, setRows] = useState<ExcelRow[]>([]);
    const [deletedIds, setDeletedIds] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState<string | number | null>(null);

    const year = initialYear || new Date().getFullYear().toString();

    const fetchExpenses = useCallback(async () => {
        setIsLoading(true);
        try {
            const expenses = await getExpenses(year);
            const mappedRows: ExcelRow[] = expenses.map(e => ({
                id: e.id!,
                date: e.date,
                description: e.description,
                amount: e.amount,
                category: e.category,
                payerName: e.payerName,
                participants: e.participants || PARTNERS,
                receiptUrl: e.receiptUrl
            }));
            setRows(mappedRows);
        } catch (err) {
            console.error("Error fetching expenses:", err);
        } finally {
            setIsLoading(false);
        }
    }, [year]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const addRow = () => {
        const newRow: ExcelRow = {
            id: `new-${Date.now()}`,
            isNew: true,
            date: new Date().toISOString().split('T')[0],
            description: "",
            amount: '',
            category: "Övrigt",
            payerName: session?.user?.name || "Joel Berring",
            participants: [...PARTNERS],
            receiptUrl: ""
        };
        setRows([newRow, ...rows]);
    };

    const removeRow = (id: string | number) => {
        if (typeof id === 'string' && !id.startsWith('new-')) {
            setDeletedIds([...deletedIds, id]);
        }
        setRows(rows.filter(row => row.id !== id));
    };

    const updateRow = (id: string | number, field: keyof ExcelRow, value: string | number | string[]) => {
        setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const toggleParticipant = (rowId: string | number, name: string) => {
        setRows(rows.map(row => {
            if (row.id === rowId) {
                const current = row.participants || [];
                const next = current.includes(name)
                    ? current.filter((n: string) => n !== name)
                    : [...current, name];
                return { ...row, participants: next.length > 0 ? next : current };
            }
            return row;
        }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, rowId: string | number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingId(rowId);
        try {
            const url = await uploadReceipt(file);
            updateRow(rowId, 'receiptUrl', url);
        } catch (err) {
            console.error("Upload error:", err);
            alert("Kunde inte ladda upp bilden.");
        } finally {
            setUploadingId(null);
        }
    };

    const saveAll = async () => {
        setIsSaving(true);
        try {
            // 1. Delete rows
            await Promise.all(deletedIds.map(id => deleteExpense(id)));

            // 2. Add/Update rows
            const validRows = rows.filter(r => r.amount && parseFloat(r.amount.toString()) > 0 && r.description);

            await Promise.all(validRows.map(async (row) => {
                const expenseData: Omit<Expense, "id" | "createdAt" | "year"> = {
                    date: row.date,
                    description: row.description,
                    amount: parseFloat(row.amount.toString()),
                    category: row.category,
                    participants: row.participants,
                    receiptUrl: row.receiptUrl,
                    payerName: row.payerName,
                };

                if (row.isNew) {
                    await saveExpense(expenseData);
                } else {
                    await updateExpense(row.id as string, expenseData);
                }
            }));

            if (onSave) onSave();
            else window.location.reload();
        } catch (error) {
            console.error("Error saving:", error);
            alert("Kunde inte spara alla ändringar.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.excelContainer} style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 className="animate-spin" size={48} />
            </div>
        );
    }

    return (
        <div className={styles.excelContainer}>
            <div className={styles.excelHeader}>
                <h2>Excel-läge ({year})</h2>
                <div className={styles.totalBadge}>
                    Totalt: {Math.round(rows.reduce((sum, r) => sum + (parseFloat(r.amount?.toString() || '0') || 0), 0))} kr
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.excelTable}>
                    <thead>
                        <tr>
                            <th style={{ width: '120px' }}>Datum</th>
                            <th>Beskrivning</th>
                            <th style={{ width: '100px' }}>Belopp</th>
                            <th style={{ width: '150px' }}>Kategori</th>
                            <th style={{ width: '150px' }}>Betalare</th>
                            <th style={{ width: '120px' }}>Deltagare</th>
                            <th style={{ width: '80px' }}>Bilaga</th>
                            <th style={{ width: '50px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id} className={row.isNew ? styles.newRow : ''}>
                                <td>
                                    <input
                                        type="date"
                                        className={styles.cellInput}
                                        value={row.date}
                                        onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        className={styles.cellInput}
                                        value={row.description}
                                        onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                                        placeholder="Beskrivning..."
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        className={styles.cellInput}
                                        value={row.amount}
                                        onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                                        placeholder="0"
                                    />
                                </td>
                                <td>
                                    <select
                                        className={styles.cellSelect}
                                        value={row.category}
                                        onChange={(e) => updateRow(row.id, 'category', e.target.value)}
                                    >
                                        <option value="Mat">Mat & Dryck</option>
                                        <option value="Hamnavgift">Hamnavgift</option>
                                        <option value="Bränsle">Bränsle</option>
                                        <option value="Underhåll">Underhåll & Fix</option>
                                        <option value="Försäkring">Försäkring</option>
                                        <option value="Övrigt">Övrigt</option>
                                    </select>
                                </td>
                                <td>
                                    <select
                                        className={styles.cellSelect}
                                        value={row.payerName}
                                        onChange={(e) => updateRow(row.id, 'payerName', e.target.value)}
                                    >
                                        {PARTNERS.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <div className={styles.participantsCell}>
                                        {PARTNERS.map(name => {
                                            const isActive = row.participants.includes(name);
                                            return (
                                                <div
                                                    key={name}
                                                    onClick={() => toggleParticipant(row.id, name)}
                                                    className={`${styles.avatarMini} ${isActive ? styles.active : ''}`}
                                                    title={name}
                                                >
                                                    {name[0]}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.receiptCell}>
                                        <input
                                            type="file"
                                            id={`file-${row.id}`}
                                            onChange={(e) => handleFileUpload(e, row.id)}
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                        />
                                        <label htmlFor={`file-${row.id}`} className={`${styles.uploadIconBtn} ${row.receiptUrl ? styles.hasFile : ''}`}>
                                            {uploadingId === row.id ? <Loader2 className="animate-spin" size={16} /> :
                                                row.receiptUrl ? <CheckCircle2 size={16} /> : <Camera size={16} />}
                                        </label>
                                    </div>
                                </td>
                                <td>
                                    <button onClick={() => removeRow(row.id)} className={styles.deleteBtn}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={styles.mainActions}>
                <button onClick={addRow} className={styles.addMoreBtn}>
                    <Plus size={18} /> Lägg till rad
                </button>
                <button onClick={saveAll} className={styles.saveBtn} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    <span>Spara allt</span>
                </button>
            </div>
        </div>
    );
}

