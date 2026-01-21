"use client";

import { useState, useRef } from "react";
import styles from "./excel.module.css";
import { Save, Trash2, Plus, CheckCircle2, Users, Camera, Loader2, Image as ImageIcon } from "lucide-react";
import { saveMultipleExpenses, uploadReceipt } from "@/lib/expenseService";
import { useSession } from "next-auth/react";

const PARTNERS = ["Joel Berring", "Avenir Kobetski", "Samuel Lundqvist"];

export default function ExcelMode({ onSave }: { onSave?: () => void }) {
    const { data: session } = useSession();
    const [rows, setRows] = useState<any[]>([{
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        desc: "",
        amount: '', // Changed to empty string initially to avoid 0 placeholder
        category: "Övrigt",
        participants: [...PARTNERS],
        receiptUrl: ""
    }]);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingId, setUploadingId] = useState<number | null>(null);

    const addRow = () => {
        setRows([...rows, {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            desc: "",
            amount: '',
            category: "Övrigt",
            participants: [...PARTNERS],
            receiptUrl: ""
        }]);
    };

    const removeRow = (id: number | string) => {
        setRows(rows.filter(row => row.id !== id));
    };

    const updateRow = (id: number | string, field: string, value: any) => {
        setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const toggleParticipant = (rowId: number, name: string) => {
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, rowId: number) => {
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
        const validRows = rows.filter(r => r.amount && r.amount > 0 && r.desc);
        if (validRows.length === 0) {
            alert("Fyll i minst ett belopp och beskrivning.");
            return;
        }

        setIsSaving(true);
        try {
            const expensesToSave = validRows.map(({ date, desc, amount, category, participants, receiptUrl }) => ({
                date,
                description: desc,
                amount: parseFloat(amount),
                category,
                participants,
                receiptUrl,
                payerName: session?.user?.name || "Joel Berring",
            }));

            await saveMultipleExpenses(expensesToSave);
            if (onSave) onSave();
            else window.location.reload();
        } catch (error) {
            console.error("Error saving:", error);
            setIsSaving(false);
            alert("Kunde inte spara.");
        }
    };

    return (
        <div className={styles.excelContainer}>
            <div className={styles.excelHeader}>
                <h2>Lägg till utlägg</h2>
                <div className={styles.totalBadge}>
                    Totalt: {Math.round(rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0))} kr
                </div>
            </div>

            <div className={styles.formList}>
                {rows.map((row) => (
                    <div key={row.id} className={styles.card}>
                        <button onClick={() => removeRow(row.id)} className={styles.deleteRowBtn}>
                            <Trash2 size={20} />
                        </button>

                        <div className={styles.amountGroup}>
                            <input
                                type="number"
                                className={styles.amountInput}
                                value={row.amount}
                                onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                                placeholder="0"
                                autoFocus={rows.length === 1}
                            />
                            <span className={styles.currencyLabel}>Kronor (SEK)</span>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Beskrivning</label>
                            <input
                                type="text"
                                className={styles.textInput}
                                value={row.desc}
                                onChange={(e) => updateRow(row.id, 'desc', e.target.value)}
                                placeholder="Vad köpte du?"
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Kategori</label>
                            <select className={styles.categorySelect} value={row.category} onChange={(e) => updateRow(row.id, 'category', e.target.value)}>
                                <option value="Mat">Mat & Dryck</option>
                                <option value="Hamnavgift">Hamnavgift</option>
                                <option value="Bränsle">Bränsle</option>
                                <option value="Underhåll">Underhåll & Fix</option>
                                <option value="Försäkring">Försäkring</option>
                                <option value="Övrigt">Övrigt</option>
                            </select>
                        </div>

                        <div className={styles.splitSection}>
                            <span className={styles.splitLabel}>Vilka ska dela på detta?</span>
                            <div className={styles.avatars}>
                                {PARTNERS.map(name => {
                                    const isActive = row.participants.includes(name);
                                    return (
                                        <button
                                            key={name}
                                            onClick={() => toggleParticipant(row.id, name)}
                                            className={`${styles.avatarToggle} ${isActive ? styles.active : ''}`}
                                        >
                                            <div className={styles.avatarCircle}>
                                                {isActive ? <CheckCircle2 size={24} /> : name[0]}
                                            </div>
                                            <span className={styles.avatarName}>{name.split(' ')[0]}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={styles.receiptSection}>
                            <input
                                type="file"
                                className="hidden"
                                id={`file-${row.id}`}
                                onChange={(e) => handleFileUpload(e, row.id)}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                            <label htmlFor={`file-${row.id}`} className={`${styles.uploadBtn} ${row.receiptUrl ? styles.hasFile : ''}`}>
                                {uploadingId === row.id ? <Loader2 className="animate-spin" size={16} /> :
                                    row.receiptUrl ? <><CheckCircle2 size={16} /> Kvitto Uppladdat</> : <><Camera size={16} /> Fota Kvitto</>}
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.mainActions}>
                <button onClick={addRow} className={styles.addMoreBtn}>
                    <Plus size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Lägg till ett utlägg till
                </button>
                <button onClick={saveAll} className={styles.saveBtn} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                    <span>Spara Utlägg</span>
                </button>
            </div>
        </div>
    );
}
