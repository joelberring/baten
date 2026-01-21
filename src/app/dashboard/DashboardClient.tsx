"use client";

import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { Anchor, Plus, TrendingUp, TrendingDown, Table as TableIcon, List, ArrowRight, Download, ArrowUpDown, ChevronUp, ChevronDown, Trash2, PieChart, Search, X, Smartphone } from "lucide-react";
import styles from "./dashboard.module.css";
import ExpenseItem from "@/components/expenses/ExpenseItem";
import ExcelMode from "@/components/excel/ExcelMode";
import { useState, use, useEffect, useMemo } from "react";
import { getExpenses, getPayments, Expense, Payment, savePayment, deleteExpense } from "@/lib/expenseService";

type SortField = 'date' | 'description' | 'category' | 'payerName' | 'amount';
type SortOrder = 'asc' | 'desc';
type Mode = "list" | "excel" | "ledger" | "overview";

const PARTNERS = ["Joel Berring", "Avenir Kobetski", "Samuel Lundqvist"];

export default function DashboardClient({ searchParams }: { searchParams: Promise<{ mode?: string, year?: string }> }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const resolvedParams = use(searchParams);
    const mode = (resolvedParams.mode || "list") as Mode;
    const year = resolvedParams.year || new Date().getFullYear().toString();

    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [allPayments, setAllPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState<{ field: SortField, order: SortOrder }>({ field: 'date', order: 'desc' });
    const [showSettlement, setShowSettlement] = useState(false);
    const [isSavingPayment, setIsSavingPayment] = useState(false);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [expData, payData] = await Promise.all([
                    getExpenses("all"),
                    getPayments("all")
                ]);
                setAllExpenses(expData);
                setAllPayments(payData);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        }
        if (status === "authenticated") fetchData();
    }, [status]);

    const currentUser = session?.user?.name || "Joel Berring";

    // Re-calculate accounting logic with participants support
    const accountingData = useMemo(() => {
        const selectedYearInt = parseInt(year);
        const partnerStats = PARTNERS.reduce((acc, name) => {
            acc[name] = { ib: 0, currentPaid: 0, currentDebt: 0, currentReceived: 0, currentSent: 0 };
            return acc;
        }, {} as Record<string, { ib: number, currentPaid: number, currentDebt: number, currentReceived: number, currentSent: number }>);

        const categoryStats: Record<string, number> = {};
        let totalYearExpenses = 0;

        allExpenses.forEach(exp => {
            const y = parseInt(exp.year);
            const participants = exp.participants || PARTNERS;
            const share = exp.amount / participants.length;

            if (y < selectedYearInt) {
                PARTNERS.forEach(p => {
                    const isPayer = exp.payerName === p;
                    const isParticipant = participants.includes(p);
                    if (isPayer && isParticipant) partnerStats[p].ib += (exp.amount - share);
                    else if (isPayer) partnerStats[p].ib += exp.amount;
                    else if (isParticipant) partnerStats[p].ib -= share;
                });
            } else if (y === selectedYearInt) {
                partnerStats[exp.payerName].currentPaid += exp.amount;
                totalYearExpenses += exp.amount;
                categoryStats[exp.category] = (categoryStats[exp.category] || 0) + exp.amount;

                // Track debts for current year
                participants.forEach(p => {
                    if (p !== exp.payerName) {
                        partnerStats[p].currentDebt += share;
                    }
                });
            }
        });

        allPayments.forEach(p => {
            if (p.status !== "Slutförd") return;
            const y = parseInt(p.year);
            if (y < selectedYearInt) {
                if (partnerStats[p.from]) partnerStats[p.from].ib += p.amount;
                if (partnerStats[p.to]) partnerStats[p.to].ib -= p.amount;
            } else if (y === selectedYearInt) {
                if (partnerStats[p.from]) partnerStats[p.from].currentSent += p.amount;
                if (partnerStats[p.to]) partnerStats[p.to].currentReceived += p.amount;
            }
        });

        return { partnerStats, totalYearExpenses, currentExpenses: allExpenses.filter(e => e.year === year), currentPayments: allPayments.filter(p => p.year === year), categoryStats };
    }, [allExpenses, allPayments, year]);

    const filteredExpenses = useMemo(() => {
        if (!searchQuery) return accountingData.currentExpenses;
        const q = searchQuery.toLowerCase();
        return accountingData.currentExpenses.filter(e =>
            e.description.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q) ||
            e.payerName.toLowerCase().includes(q)
        );
    }, [accountingData.currentExpenses, searchQuery]);

    const sortedExpenses = useMemo(() => {
        const sorted = [...filteredExpenses];
        sorted.sort((a, b) => {
            const valA = a[sortConfig.field];
            const valB = b[sortConfig.field];
            if (valA === undefined || valB === undefined) return 0;
            if (typeof valA === 'string' && typeof valB === 'string') return sortConfig.order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            if (typeof valA === 'number' && typeof valB === 'number') return sortConfig.order === 'asc' ? valA - valB : valB - valA;
            return 0;
        });
        return sorted;
    }, [filteredExpenses, sortConfig]);

    const stat = accountingData.partnerStats[currentUser];
    const userBalance = stat.ib + stat.currentPaid - stat.currentDebt + stat.currentSent - stat.currentReceived;

    if (status === "unauthenticated") redirect("/login");

    const years = ["2026", "2025", "2024"];

    const toggleSort = (field: SortField) => {
        setSortConfig(current => ({
            field,
            order: current.field === field && current.order === 'desc' ? 'asc' : 'desc'
        }));
    };

    const handleDelete = async (id: string, payerName: string) => {
        if (payerName !== currentUser && !currentUser.includes("Joel")) {
            alert("Du kan bara ta bort dina egna utlägg.");
            return;
        }
        if (confirm("Är du säker på att du vill ta bort detta utlägg?")) {
            try {
                await deleteExpense(id);
                setAllExpenses(allExpenses.filter(e => e.id !== id));
            } catch (err) {
                console.error("Error deleting:", err);
            }
        }
    };

    const handleSettleUp = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const amount = parseFloat(formData.get('amount') as string);
        const to = formData.get('to') as string;
        if (!amount || !to) return;
        setIsSavingPayment(true);
        try {
            await savePayment({
                from: currentUser, to: to, amount: amount,
                date: new Date().toISOString().split('T')[0],
                description: "Skuldbetalning via Dashboard", status: "Slutförd"
            });
            window.location.reload();
        } catch (err) {
            console.error("Error saving payment:", err);
            setIsSavingPayment(false);
        }
    };

    const generateSwishLink = (to: string, amount: number) => {
        // Mock phone numbers since we don't have a settings page yet
        const phones: Record<string, string> = {
            "Joel Berring": "0701234567",
            "Avenir Kobetski": "0709876543",
            "Samuel Lundqvist": "0705554433"
        };
        const phone = phones[to] || "";
        const msg = `Viggen Utlägg: Betalning för ${year}`;
        alert(`Öppnar Swish för att betala ${amount} kr till ${to} (${phone})...\n\n(I en riktig PWA skulle detta öppna Swish-appen direkt)`);
        // window.location.href = `swish://payment?data=${JSON.stringify({payee: phone, amount: amount, message: msg})}`;
    };

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div className={styles.logo} onClick={() => router.push('/dashboard')}>
                    <Anchor size={24} color="var(--brass)" />
                    <span>Viggen Utlägg</span>
                </div>
                <nav className={styles.yearNav}>
                    {years.map(y => (
                        <button key={y} onClick={() => router.push(`?year=${y}&mode=${mode}`)} className={`${styles.yearLink} ${year === y ? styles.activeYear : ''}`}>
                            {y}
                        </button>
                    ))}
                </nav>
                <div className={styles.user}><span>Välkommen, {session?.user?.name}</span></div>
            </header>

            <div className={styles.grid}>
                <aside className={styles.sidebar}>
                    <section className={`${styles.stats} glass`}>
                        <h2>Status - {year}</h2>
                        <div className={styles.statRow}>
                            <div className={styles.statItem}>
                                <TrendingUp color="#10b981" />
                                <div><p>Att få tillbaka</p><strong>{Math.max(0, Math.round(userBalance > 0 ? userBalance : 0))} SEK</strong></div>
                            </div>
                            <div className={styles.statItem}>
                                <TrendingDown color="#ef4444" />
                                <div><p>Att betala</p><strong>{Math.max(0, Math.round(userBalance < 0 ? -userBalance : 0))} SEK</strong></div>
                            </div>
                        </div>
                    </section>

                    <section className={`${styles.chartSection} glass`}>
                        <h2>Spendering per kategori</h2>
                        <div className={styles.chartLegend}>
                            {Object.entries(accountingData.categoryStats).map(([cat, val], idx) => (
                                <div key={cat} className={styles.legendItem}>
                                    <div className={styles.legendColor} style={{ background: `hsl(${idx * 45}, 60%, 50%)` }}></div>
                                    <span>{cat}</span><strong>{Math.round((val / accountingData.totalYearExpenses) * 100)}%</strong>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className={`${styles.settleSection} glass`}>
                        <h2>Registrera Swish</h2>
                        {!showSettlement ? (
                            <button className={styles.avraknaBtn} onClick={() => setShowSettlement(true)}>
                                <Smartphone size={16} /> Markera som betald
                            </button>
                        ) : (
                            <form onSubmit={handleSettleUp} className={styles.settleForm}>
                                <select name="to" required defaultValue="">
                                    <option value="" disabled>Till vem?</option>
                                    {PARTNERS.filter(n => n !== currentUser).map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <input type="number" name="amount" placeholder="Belopp (kr)" required />
                                <div className={styles.formActions}>
                                    <button type="button" onClick={() => setShowSettlement(false)}>Avbryt</button>
                                    <button type="submit" disabled={isSavingPayment} className={styles.saveBtn}>Spara</button>
                                </div>
                            </form>
                        )}
                    </section>
                </aside>

                <section className={`${styles.log} glass`}>
                    <div className={styles.logHeader}>
                        <div className={styles.viewTabs}>
                            <button onClick={() => router.push(`?mode=list&year=${year}`)} className={`${styles.tab} ${mode === 'list' ? styles.active : ''}`}><List size={18} /> Loggbok</button>
                            <button onClick={() => router.push(`?mode=ledger&year=${year}`)} className={`${styles.tab} ${mode === 'ledger' ? styles.active : ''}`}><TableIcon size={18} /> Huvudbok</button>
                            <button onClick={() => router.push(`?mode=overview&year=${year}`)} className={`${styles.tab} ${mode === 'overview' ? styles.active : ''}`}><PieChart size={18} /> Årsöversikt</button>
                        </div>
                        <div className={styles.searchBar}>
                            <Search size={18} className={styles.searchIcon} />
                            <input type="text" placeholder="Sök..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            {searchQuery && <X size={14} className={styles.clearSearch} onClick={() => setSearchQuery("")} />}
                        </div>
                        <div className={styles.actions}>
                            <button className="btn-brass" onClick={() => router.push(`?mode=excel&year=${year}`)}><Plus size={18} /> Nytt utlägg</button>
                        </div>
                    </div>

                    <div className={styles.content}>
                        {mode === 'excel' ? <ExcelMode /> : mode === 'overview' ? (
                            <div className={styles.overviewWrapper}>
                                <table className={styles.overviewTable}>
                                    <thead>
                                        <tr>
                                            <th>Medlem</th>
                                            <th>Utlägg</th>
                                            <th>Skuld (Andel)</th>
                                            <th>Betalat till andra</th>
                                            <th>Fått av andra</th>
                                            <th>IB ({year})</th>
                                            <th>Netto Balans</th>
                                            <th>Swisha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {PARTNERS.map(name => {
                                            const s = accountingData.partnerStats[name];
                                            const net = s.ib + s.currentPaid - s.currentDebt + s.currentSent - s.currentReceived;
                                            return (
                                                <tr key={name} className={name === currentUser ? styles.currentPartnerRow : ''}>
                                                    <td><strong>{name}</strong></td>
                                                    <td>{Math.round(s.currentPaid)} kr</td>
                                                    <td>-{Math.round(s.currentDebt)} kr</td>
                                                    <td style={{ color: '#10b981' }}>+{Math.round(s.currentSent)} kr</td>
                                                    <td style={{ color: '#ef4444' }}>-{Math.round(s.currentReceived)} kr</td>
                                                    <td>{Math.round(s.ib)} kr</td>
                                                    <td className={styles.amount} style={{ color: net > 0 ? '#10b981' : net < 0 ? '#ef4444' : 'inherit' }}>{Math.round(net)} kr</td>
                                                    <td>
                                                        {net < 0 && name === currentUser && (
                                                            <button onClick={() => generateSwishLink("Samuel Lundqvist", Math.abs(Math.round(net)))} className={styles.swishBtnSmall}>Swisha</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : mode === 'ledger' ? (
                            <div className={styles.ledgerWrapper}>
                                <table className={styles.ledgerTable}>
                                    <thead>
                                        <tr>
                                            <th onClick={() => toggleSort('date')}>Datum</th>
                                            <th onClick={() => toggleSort('description')}>Beskrivning</th>
                                            <th onClick={() => toggleSort('category')}>Kategori</th>
                                            <th onClick={() => toggleSort('payerName')}>Betalare</th>
                                            <th>Split</th>
                                            <th onClick={() => toggleSort('amount')} className={styles.amountHead}>Belopp</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedExpenses.map(exp => (
                                            <tr key={exp.id}>
                                                <td>{exp.date}</td>
                                                <td>{exp.description}</td>
                                                <td>{exp.category}</td>
                                                <td>{exp.payerName}</td>
                                                <td className={styles.participantsCell}>
                                                    {exp.participants ? `${exp.participants.length}/3` : "3/3"}
                                                </td>
                                                <td className={styles.amount}>{Math.round(exp.amount)} kr</td>
                                                <td className={styles.actionsCell}>
                                                    {(exp.payerName === currentUser || currentUser.includes("Joel")) && (
                                                        <button onClick={() => handleDelete(exp.id!, exp.payerName)} className={styles.deleteMini}><Trash2 size={14} /></button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className={styles.expenseList}>
                                {sortedExpenses.map(exp => <ExpenseItem key={exp.id} expense={exp} />)}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
