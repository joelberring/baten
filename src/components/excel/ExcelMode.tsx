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
        amount: 0,
        category: "Övrigt",
        participants: [...PARTNERS],
        receiptUrl: ""
    }]);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingId, setUploadingId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addRow = () => {
        setRows([...rows, {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            desc: "",
            amount: 0,
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
        if (rows.length === 0) return;
        setIsSaving(true);
        try {
            const expensesToSave = rows.map(({ date, desc, amount, category, participants, receiptUrl }) => ({
                date,
                description: desc,
                amount,
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
                <h2>Mata in utlägg</h2>
                <div className={styles.excelActions}>
                    <div className={styles.totalBadge}>
                        Totalt: {Math.round(rows.reduce((sum, r) => sum + (r.amount || 0), 0))} kr
                    </div>
                    <button onClick={addRow} className="btn-brass"><Plus size={16} /> Ny rad</button>
                    <button onClick={saveAll} className={styles.saveBtn} disabled={isSaving || rows.length === 0}>
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Spara allt
                    </button>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Datum</th>
                            <th>Beskrivning</th>
                            <th>Belopp</th>
                            <th>Kategori</th>
                            <th>Vem delar?</th>
                            <th>Kvitto</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id}>
                                <td><input type="date" value={row.date} onChange={(e) => updateRow(row.id, 'date', e.target.value)} /></td>
                                <td><input type="text" value={row.desc} onChange={(e) => updateRow(row.id, 'desc', e.target.value)} placeholder="T.ex. Hamnavgift" /></td>
                                <td><input type="number" value={row.amount} onChange={(e) => updateRow(row.id, 'amount', parseFloat(e.target.value) || 0)} /></td>
                                <td>
                                    <select value={row.category} onChange={(e) => updateRow(row.id, 'category', e.target.value)}>
                                        <option value="Underhåll">Underhåll</option>
                                        <option value="Bränsle">Bränsle</option>
                                        <option value="Hamnavgift">Hamnavgift</option>
                                        <option value="Försäkring">Försäkring</option>
                                        <option value="Mat">Mat</option>
                                        <option value="Övrigt">Övrigt</option>
                                    </select>
                                </td>
                                <td>
                                    <div className={styles.splitToggle}>
                                        {PARTNERS.map(name => (
                                            <button
                                                key={name}
                                                onClick={() => toggleParticipant(row.id, name)}
                                                className={row.participants.includes(name) ? styles.activeSplit : ''}
                                            >
                                                {name[0]}
                                            </button>
                                        ))}
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.uploadCell}>
                                        <input
                                            type="file"
                                            className="hidden"
                                            id={`file-${row.id}`}
                                            onChange={(e) => handleFileUpload(e, row.id)}
                                            accept="image/*"
                                        />
                                        <label htmlFor={`file-${row.id}`} className={styles.uploadBtn}>
                                            {uploadingId === row.id ? <Loader2 className="animate-spin" size={14} /> :
                                                row.receiptUrl ? <CheckCircle2 size={14} color="#10b981" /> : <Camera size={14} />}
                                        </label>
                                    </div>
                                </td>
                                <td><button onClick={() => removeRow(row.id)} className={styles.deleteBtn}><Trash2 size={16} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
