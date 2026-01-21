"use client";

import { useState } from "react";
import styles from "./excel.module.css";
import { Save, Trash2, Plus } from "lucide-react";

export default function ExcelMode() {
    const [rows, setRows] = useState([
        { id: 1, date: "2026-06-15", desc: "Marin Diesel", amount: 1200, category: "Bränsle" },
        { id: 2, date: "2026-06-12", desc: "Olja & filter", amount: 2500, category: "Underhåll" },
    ]);

    const addRow = () => {
        setRows([...rows, { id: Date.now(), date: "", desc: "", amount: 0, category: "Övrigt" }]);
    };

    return (
        <div className={styles.excelContainer}>
            <div className={styles.excelHeader}>
                <h2>Excel-läge (Snabbinmatning)</h2>
                <div className={styles.excelActions}>
                    <button onClick={addRow} className="btn-brass"><Plus size={16} /> Lägg till rad</button>
                    <button className={styles.saveBtn}><Save size={16} /> Spara allt</button>
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
                                <td><input type="date" defaultValue={row.date} /></td>
                                <td><input type="text" defaultValue={row.desc} placeholder="T.ex. Bottenfärg" /></td>
                                <td><input type="number" defaultValue={row.amount} /></td>
                                <td>
                                    <select defaultValue={row.category}>
                                        <option>Bränsle</option>
                                        <option>Underhåll</option>
                                        <option>Hamnavgift</option>
                                        <option>Mat</option>
                                        <option>Övrigt</option>
                                    </select>
                                </td>
                                <td>
                                    <button className={styles.deleteBtn}><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
