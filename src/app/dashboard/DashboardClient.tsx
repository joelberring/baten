"use client";

import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { Anchor, Plus, TrendingUp, TrendingDown, Table as TableIcon, List, ArrowRight, Download } from "lucide-react";
import styles from "./dashboard.module.css";
import ExpenseItem from "@/components/expenses/ExpenseItem";
import ExcelMode from "@/components/excel/ExcelMode";
import { useState, use, useEffect } from "react";
import { getExpenses, Expense } from "@/lib/expenseService";

export default function DashboardClient({ searchParams }: { searchParams: Promise<{ mode?: string, year?: string }> }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const resolvedParams = use(searchParams);
    const mode = (resolvedParams.mode || "list") as "list" | "excel" | "ledger";
    const year = resolvedParams.year || "2026";

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [paid, setPaid] = useState(false);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const data = await getExpenses(year);
                setExpenses(data);
            } catch (err) {
                console.error("Error fetching expenses:", err);
            } finally {
                setLoading(false);
            }
        }
        if (status === "authenticated") {
            fetchData();
        }
    }, [year, status]);

    if (status === "unauthenticated") {
        redirect("/login");
    }

    if (status === "loading" || (loading && expenses.length === 0)) {
        return <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Laddar båtens loggbok...</div>;
    }

    const years = ["2026", "2025"];

    const mockPayments = [
        { from: "Erik", to: "Anna", amount: 1200, status: "Slutförd", date: "2026-01-15" }
    ];

    const currentUser = session?.user?.name || "Joel";
    let toReceive = 0;
    let toPay = 0;

    expenses.forEach(exp => {
        const share = exp.amount / 3;
        if (exp.payerName === currentUser) {
            toReceive += (exp.amount - share);
        } else {
            toPay += share;
        }
    });

    if (currentUser === "Erik") toPay -= 1200;
    if (currentUser === "Anna") toReceive -= 1200;

    const handlePay = () => {
        setPaying(true);
        setTimeout(() => {
            setPaying(false);
            setPaid(true);
            setTimeout(() => setPaid(false), 3000);
        }, 1500);
    };

    const exportToCSV = () => {
        const headers = ["Datum", "Beskrivning", "Kategori", "Betalare", "Belopp"];
        const rows = expenses.map(e => [e.date, e.description, e.category, e.payerName, e.amount]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Viggen_Utlägg_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div className={styles.logo}>
                    <Anchor size={24} color="var(--brass)" />
                    <span>Viggen Utlägg</span>
                </div>

                <nav className={styles.yearNav}>
                    {years.map(y => (
                        <button
                            key={y}
                            onClick={() => router.push(`?year=${y}&mode=${mode}`)}
                            className={`${styles.yearLink} ${year === y ? styles.activeYear : ''}`}
                        >
                            {y}
                        </button>
                    ))}
                </nav>

                <div className={styles.user}>
                    <span>Välkommen, {session?.user?.name}</span>
                </div>
            </header>

            <div className={styles.grid}>
                <aside className={styles.sidebar}>
                    <section className={`${styles.stats} glass`}>
                        <h2>Status - {year}</h2>
                        <div className={styles.statRow}>
                            <div className={styles.statItem}>
                                <TrendingUp color="#10b981" />
                                <div>
                                    <p>Att få tillbaka</p>
                                    <strong>{Math.round(toReceive)} SEK</strong>
                                </div>
                            </div>
                            <div className={styles.statItem}>
                                <TrendingDown color="#ef4444" />
                                <div>
                                    <p>Att betala</p>
                                    <strong>{Math.round(toPay)} SEK</strong>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className={`${styles.debts} glass`}>
                        <h2>Skulder & Avräkningar</h2>
                        <div className={styles.debtList}>
                            <div className={styles.debtItem}>
                                <div className={styles.debtPair}>
                                    <span>Anna</span> <ArrowRight size={14} /> <span>Joel</span>
                                </div>
                                <strong>1,500 SEK</strong>
                                <button
                                    className={`${styles.payBtn} ${paid ? styles.paid : ''}`}
                                    onClick={handlePay}
                                    disabled={paying}
                                >
                                    {paying ? "..." : paid ? "Betalat!" : "Betala"}
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className={`${styles.payments} glass`}>
                        <h2>Genomförda Betalningar</h2>
                        <div className={styles.paymentList}>
                            {mockPayments.map((p, idx) => (
                                <div key={idx} className={styles.paymentItem}>
                                    <div className={styles.pInfo}>
                                        <span>{p.from} betalade {p.to}</span>
                                        <span className={styles.pDate}>{p.date}</span>
                                    </div>
                                    <strong>{p.amount} SEK</strong>
                                </div>
                            ))}
                        </div>
                    </section>
                </aside>

                <section className={`${styles.log} glass`}>
                    <div className={styles.logHeader}>
                        <div className={styles.viewTabs}>
                            <button onClick={() => router.push(`?mode=list&year=${year}`)} className={`${styles.tab} ${mode === 'list' ? styles.active : ''}`}>
                                <List size={18} /> Loggbok
                            </button>
                            <button onClick={() => router.push(`?mode=ledger&year=${year}`)} className={`${styles.tab} ${mode === 'ledger' ? styles.active : ''}`}>
                                <TableIcon size={18} /> Huvudbok
                            </button>
                            <button onClick={() => router.push(`?mode=excel&year=${year}`)} className={`${styles.tab} ${mode === 'excel' ? styles.active : ''}`}>
                                <TableIcon size={18} /> Snabbmatning
                            </button>
                        </div>
                        <div className={styles.actions}>
                            {mode === 'ledger' && (
                                <button onClick={exportToCSV} className={styles.exportBtn}>
                                    <Download size={18} /> Exportera till Excel
                                </button>
                            )}
                            <button className="btn-brass" onClick={() => router.push(`?mode=excel&year=${year}`)}><Plus size={18} /> Nytt utlägg</button>
                        </div>
                    </div>

                    <div className={styles.content}>
                        {mode === 'excel' ? (
                            <ExcelMode />
                        ) : mode === 'ledger' ? (
                            <div className={styles.ledgerWrapper}>
                                <table className={styles.ledgerTable}>
                                    <thead>
                                        <tr>
                                            <th>Datum</th>
                                            <th>Beskrivning</th>
                                            <th>Kategori</th>
                                            <th>Betalare</th>
                                            <th>Belopp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenses.map(exp => (
                                            <tr key={exp.id}>
                                                <td>{exp.date}</td>
                                                <td>{exp.description}</td>
                                                <td>{exp.category}</td>
                                                <td>{exp.payerName}</td>
                                                <td className={styles.amount}>{exp.amount} kr</td>
                                            </tr>
                                        ))}
                                        {expenses.length === 0 && (
                                            <tr>
                                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                                                    Inga utlägg hittades för {year}.
                                                </td>
                                            </tr>
                                        )}
                                        <tr className={styles.totalRow}>
                                            <td colSpan={4}>TOTALT UTGIFTER</td>
                                            <td className={styles.amount}>{expenses.reduce((sum, e) => sum + e.amount, 0)} kr</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className={styles.expenseList}>
                                {expenses.map(exp => (
                                    <ExpenseItem key={exp.id} expense={exp} />
                                ))}
                                {expenses.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                                        Loggboken är tom för {year}.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
