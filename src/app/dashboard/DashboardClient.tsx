"use client";

import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { Anchor, Plus, TrendingUp, TrendingDown, Table as TableIcon, List, ArrowRight, Download, ArrowUpDown, ChevronUp, ChevronDown, Trash2, PieChart, Search, X, Smartphone, Image as ImageIcon, ExternalLink } from "lucide-react";
import styles from "./dashboard.module.css";
import ExpenseItem from "@/components/expenses/ExpenseItem";
import ExcelMode from "@/components/excel/ExcelMode";
import { useState, use, useEffect, useMemo } from "react";
import { getExpenses, getPayments, Expense, Payment, savePayment, deleteExpense } from "@/lib/expenseService";

type SortField = 'date' | 'description' | 'category' | 'payerName' | 'amount';
type SortOrder = 'asc' | 'desc';
type Mode = "list" | "excel" | "ledger" | "overview";

const PARTNERS = ["Joel Berring", "Avenir Kobetski", "Samuel Lundqvist"]; // Matchar seed-data stavning

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

    const fetchData = async () => {
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
    };

    useEffect(() => {
        if (status === "authenticated") fetchData();
    }, [status]);

    const currentUser = session?.user?.name || "Joel Berring";

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
                if (partnerStats[exp.payerName]) partnerStats[exp.payerName].currentPaid += exp.amount;
                totalYearExpenses += exp.amount;
                categoryStats[exp.category] = (categoryStats[exp.category] || 0) + exp.amount;

                participants.forEach(p => {
                    if (partnerStats[p]) {
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

    const stat = accountingData.partnerStats[currentUser] || { ib: 0, currentPaid: 0, currentDebt: 0, currentSent: 0, currentReceived: 0 };
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

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div className={styles.heroOverlay}>
                    <img src="/assets/boat/boat_profile.jpg" alt="Viggen" className={styles.heroImage} />
                </div>
                <div className={styles.headerContent}>
                    <div className={styles.logo} onClick={() => router.push('/dashboard')}>
                        <Anchor size={28} color="var(--brass)" />
                        <span>Viggen Utlägg</span>
                    </div>
                    <nav className={styles.yearNav}>
                        {years.map(y => (
                            <button key={y} onClick={() => router.push(`?year=${y}&mode=${mode}`)} className={`${styles.yearLink} ${year === y ? styles.activeYear : ''}`}>
                                {y}
                            </button>
                        ))}
                    </nav>
                    <div className={styles.user}><span>{session?.user?.name}</span></div>
                </div>
            </header>

            <div className={styles.grid}>
                <aside className={styles.sidebar}>
                    <section className={`${styles.stats} glass`}>
                        <h2>Status {year}</h2>
                        <div className={styles.statRow}>
                            <div className={styles.statItem}>
                                <TrendingUp color="#10b981" />
                                <div><p>Att få tillbaka</p><strong>{Math.max(0, Math.round(userBalance > 0 ? userBalance : 0))} kr</strong></div>
                            </div>
                            <div className={styles.statItem}>
                                <TrendingDown color="#ef4444" />
                                <div><p>Att betala</p><strong>{Math.max(0, Math.round(userBalance < 0 ? -userBalance : 0))} kr</strong></div>
                            </div>
                        </div>
                    </section>

                    <section className={`${styles.settleSection} glass`}>
                        <div className={styles.sectionHeader}>
                            <h2>Registrera Betalning</h2>
                            <Smartphone size={16} color="var(--brass)" />
                        </div>
                        <p className={styles.hintText}>Har du swishat någon? Registrera det här för att nollställa din skuld.</p>
                        {!showSettlement ? (
                            <button className={styles.avraknaBtn} onClick={() => setShowSettlement(true)}>
                                <Plus size={16} /> Lägg in betalning
                            </button>
                        ) : (
                            <form onSubmit={handleSettleUp} className={styles.settleForm}>
                                <select name="to" required defaultValue="">
                                    <option value="" disabled>Vem betalade du?</option>
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

                    <section className={`${styles.chartSection} glass`}>
                        <h2>Utgifter per kategori</h2>
                        <div className={styles.chartLegend}>
                            {Object.entries(accountingData.categoryStats).map(([cat, val], idx) => (
                                <div key={cat} className={styles.legendItem}>
                                    <div className={styles.legendColor} style={{ background: `hsl(${idx * 45}, 60%, 50%)` }}></div>
                                    <span>{cat}</span><strong>{accountingData.totalYearExpenses > 0 ? Math.round((val / accountingData.totalYearExpenses) * 100) : 0}%</strong>
                                </div>
                            ))}
                            {Object.keys(accountingData.categoryStats).length === 0 && (
                                <p className={styles.noDataText}>Inga utlägg i år</p>
                            )}
                        </div>
                    </section>

                    <div className={styles.boatMood}>
                        <img src="/assets/boat/crew_deck.jpg" alt="Besättning" className={styles.moodImage} />
                    </div>
                </aside>

                <section className={`${styles.log} glass`}>
                    <div className={styles.logHeader}>
                        <div className={styles.viewTabs}>
                            <button onClick={() => router.push(`?mode=list&year=${year}`)} className={`${styles.tab} ${mode === 'list' ? styles.active : ''}`}>Loggbok</button>
                            <button onClick={() => router.push(`?mode=ledger&year=${year}`)} className={`${styles.tab} ${mode === 'ledger' ? styles.active : ''}`}>Huvudbok</button>
                            <button onClick={() => router.push(`?mode=overview&year=${year}`)} className={`${styles.tab} ${mode === 'overview' ? styles.active : ''}`}>Årsöversikt</button>
                        </div>
                        <div className={styles.searchBar}>
                            <Search size={16} className={styles.searchIcon} />
                            <input type="text" placeholder="Sök..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <div className={styles.actions}>
                            <button className="btn-brass" onClick={() => router.push(`?mode=excel&year=${year}`)}><Plus size={18} /> Nytt utlägg</button>
                        </div>
                    </div>

                    <div className={styles.content}>
                        {mode === 'excel' ? <ExcelMode onSave={() => {
                            fetchData();
                            router.push(`?mode=ledger&year=${year}`);
                        }} /> : mode === 'overview' ? (
                            <div className={styles.overviewWrapper}>
                                <table className={styles.overviewTable}>
                                    <thead>
                                        <tr>
                                            <th>Medlem</th>
                                            <th>Utlägg</th>
                                            <th>Skuld</th>
                                            <th>Skuldreglering</th>
                                            <th>IB ({year})</th>
                                            <th>Netto Balans</th>
                                            <th>Åtgärd</th>
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
                                                    <td style={{ color: s.currentSent > s.currentReceived ? '#10b981' : '#ef4444' }}>
                                                        {Math.round(s.currentSent - s.currentReceived)} kr
                                                    </td>
                                                    <td>{Math.round(s.ib)} kr</td>
                                                    <td className={styles.amount} style={{ color: net > 0 ? '#10b981' : net < 0 ? '#ef4444' : 'inherit' }}>{Math.round(net)} kr</td>
                                                    <td>
                                                        {net < 0 && name === currentUser && (
                                                            <button
                                                                onClick={() => {
                                                                    const amount = Math.abs(Math.round(net));
                                                                    // För en riktig app skulle vi hämta motpartens telefonnummer här.
                                                                    // Swish djuplänk format: swish://payment?data={...}
                                                                    alert(`Öppnar Swish för att betala ${amount} kr. (Här skulle en djuplänk triggas om telefonnummer fanns registrerat)`);
                                                                }}
                                                                className={styles.swishBtnSmall}
                                                            >
                                                                Swisha
                                                            </button>
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
                                            <th>Bilaga</th>
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
                                                <td className={styles.participantsCell}>{exp.participants ? `${exp.participants.length}/3` : "3/3"}</td>
                                                <td className={styles.amount}>{Math.round(exp.amount)} kr</td>
                                                <td className={styles.receiptCell}>
                                                    {exp.receiptUrl ? (
                                                        <a href={exp.receiptUrl} target="_blank" rel="noopener noreferrer" className={styles.receiptLink}>
                                                            <ImageIcon size={16} />
                                                        </a>
                                                    ) : <span className={styles.noReceipt}>-</span>}
                                                </td>
                                                <td className={styles.actionsCell}>
                                                    <button onClick={() => handleDelete(exp.id!, exp.payerName)} className={styles.deleteMini}><Trash2 size={14} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className={styles.expenseList}>
                                {sortedExpenses.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <ImageIcon size={48} className={styles.emptyIcon} />
                                        <p>Här var det tomt! Inga utlägg hittades för {year}.</p>
                                        <button className="btn-brass" onClick={() => router.push(`?mode=excel&year=${year}`)}>Mata in första utlägget</button>
                                    </div>
                                ) : sortedExpenses.map(exp => (
                                    <ExpenseItem
                                        key={exp.id}
                                        expense={exp}
                                        onDelete={handleDelete}
                                        currentUserName={currentUser}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
