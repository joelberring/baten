"use client";

import { useState } from "react";
import styles from "./excel.module.css";
import { Save, Trash2, Plus, CheckCircle2 } from "lucide-react";
import { saveMultipleExpenses } from "@/lib/expenseService";

import { useSession } from "next-auth/react";

export default function ExcelMode() {
    const { data: session } = useSession();
    const [rows, setRows] = useState<any[]>([{
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        desc: "",
        amount: 0,
        category: "Övrigt"
    }]);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const addRow = () => {
        setRows([...rows, {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            desc: "",
            amount: 0,
            category: "Övrigt"
        }]);
    };

    const removeRow = (id: number | string) => {
        setRows(rows.filter(row => row.id !== id));
    };

    const updateRow = (id: number | string, field: string, value: any) => {
        setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const saveAll = async () => {
        if (rows.length === 0) return;
        setIsSaving(true);
        try {
            const expensesToSave = rows.map(({ date, desc, amount, category }) => ({
                date,
                description: desc,
                amount,
                category,
                payerName: session?.user?.name || "Joel Berring",
            }));

            await saveMultipleExpenses(expensesToSave);

            setIsSaving(false);
            setSaved(true);
            setRows([]); // Töm listan efter lyckad sparning
            setTimeout(() => setSaved(false), 3000);
            window.location.reload(); // Enkel refresh för att visa i listan
        } catch (error) {
            console.error("Error saving:", error);
            setIsSaving(false);
            alert("Kunde inte spara. Kontrollera dina Firebase-inställningar.");
        }
    };

    return (
        <div className={styles.excelContainer}>
            <div className={styles.excelHeader}>
                <h2>Snabbmatning (Excel-läge)</h2>
                <div className={styles.excelActions}>
                    <button onClick={addRow} className="btn-brass">
                        <Plus size={16} /> Lägg till rad
                    </button>
                    <button
                        onClick={saveAll}
                        className={`${styles.saveBtn} ${saved ? styles.saved : ''}`}
                        disabled={isSaving || rows.length === 0}
                    >
                        {isSaving ? "Sparar..." : saved ? <><CheckCircle2 size={16} /> Sparat!</> : <><Save size={16} /> Spara allt</>}
                    </button>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Datum</th>
                            <th>Beskrivning</th>
                            <th>Belopp (SEK)</th>
                            <th>Kategori</th>
                            <th>Åtgärder</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id}>
                                <td>
                                    <input
                                        type="date"
                                        value={row.date}
                                        onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={row.desc}
                                        onChange={(e) => updateRow(row.id, 'desc', e.target.value)}
                                        placeholder="T.ex. Bottenfärg"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={row.amount}
                                        onChange={(e) => updateRow(row.id, 'amount', parseFloat(e.target.value) || 0)}
                                    />
                                </td>
                                <td>
                                    <select
                                        value={row.category}
                                        onChange={(e) => updateRow(row.id, 'category', e.target.value)}
                                    >
                                        <option value="Bränsle">Bränsle</option>
                                        <option value="Underhåll">Underhåll</option>
                                        <option value="Hamnavgift">Hamnavgift</option>
                                        <option value="Mat">Mat</option>
                                        <option value="Övrigt">Övrigt</option>
                                    </select>
                                </td>
                                <td>
                                    <button
                                        onClick={() => removeRow(row.id)}
                                        className={styles.deleteBtn}
                                        title="Ta bort rad"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rows.length === 0 && (
                    <div className={styles.emptyState}>
                        Inga rader tillagda. Klicka på "Lägg till rad" för att börja mata in nya utlägg.
                    </div>
                )}
            </div>
        </div>
    );
}
