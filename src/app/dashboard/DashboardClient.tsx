"use client";

import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { Anchor, Plus, TrendingUp, TrendingDown, Table as TableIcon, List, ArrowRight, Download, ArrowUpDown, ChevronUp, ChevronDown, Trash2, PieChart, Search, X, Smartphone, Image as ImageIcon, ExternalLink } from "lucide-react";
import styles from "./dashboard.module.css";
import ExpenseItem from "@/components/expenses/ExpenseItem";
import ExcelMode from "@/components/excel/ExcelMode";
import { useState, use, useEffect, useMemo } from "react";
import { getExpenses, getPayments, Expense, Payment, savePayment, deleteExpense, deletePayment } from "@/lib/expenseService";

type SortField = 'date' | 'description' | 'category' | 'payerName' | 'amount';
type SortOrder = 'asc' | 'desc';
type Mode = "list" | "excel" | "ledger" | "overview" | "payments";

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

    const filteredPayments = useMemo(() => {
        return allPayments.filter(p => p.year === year || year === "all");
    }, [allPayments, year]);

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
        const isAdmin = currentUser.toLowerCase().includes("joel");
        if (payerName !== currentUser && !isAdmin) {
            alert("Du kan bara ta bort dina egna utlägg.");
            return;
        }
        if (confirm("Är du säker på att du vill ta bort detta utlägg?")) {
            try {
                await deleteExpense(id);
                setAllExpenses(prev => prev.filter(e => e.id !== id));
            } catch (err) {
                console.error("Error deleting:", err);
                alert("Kunde inte ta bort utlägget. Kontrollera din anslutning.");
            }
        }
    };

    const handleDeletePayment = async (id: string, fromName: string) => {
        const isAdmin = currentUser.toLowerCase().includes("joel");
        if (fromName !== currentUser && !isAdmin) {
            alert("Du kan bara ta bort dina egna betalningar.");
            return;
        }
        if (confirm("Är du säker på att du vill ta bort denna betalning?")) {
            try {
                await deletePayment(id);
                setAllPayments(prev => prev.filter(p => p.id !== id));
            } catch (err) {
                console.error("Error deleting payment:", err);
                alert("Kunde inte ta bort betalningen.");
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
                <div className={styles.logo} onClick={() => router.push('/dashboard')}>
                    <Anchor size={24} color="var(--viggen-orange)" />
                    <span>Viggen Utlägg</span>
                </div>
                <nav className={styles.yearNav}>
                    {years.map(y => (
                        <button key={y} onClick={() => router.push(`?year=${y}&mode=${mode}`)} className={`${styles.yearLink} ${year === y ? styles.activeYear : ''}`}>
                            {y}
                        </button>
                    ))}
                </nav>
                <div className={styles.user}><span>{session?.user?.name?.split(' ')[0]}</span></div>
            </header>

            <div className={styles.grid}>
                {/* Status Card */}
                <section className={styles.statsCard}>
                    <div className={styles.balanceLabel}>Mitt Saldo ({year})</div>
                    <div className={`${styles.balanceAmount} ${userBalance >= 0 ? styles.positive : styles.negative}`}>
                        {userBalance >= 0 ? '+' : ''}{Math.round(userBalance)} kr
                    </div>

                    <div className={styles.quickActions}>
                        <button className={styles.actionButton} onClick={() => setShowSettlement(true)}>
                            <div className={styles.actionCircle}>
                                <Smartphone size={20} />
                            </div>
                            <span>Betala</span>
                        </button>
                        <button className={styles.actionButton} onClick={() => router.push(`?mode=overview&year=${year}`)}>
                            <div className={styles.actionCircle}>
                                <PieChart size={20} />
                            </div>
                            <span>Översikt</span>
                        </button>
                    </div>
                </section>

                {/* Main Views */}
                <div className={styles.viewTabs}>
                    <button onClick={() => router.push(`?mode=list&year=${year}`)} className={`${styles.tab} ${mode === 'list' ? styles.active : ''}`}>Loggbok</button>
                    <button onClick={() => router.push(`?mode=ledger&year=${year}`)} className={`${styles.tab} ${mode === 'ledger' ? styles.active : ''}`}>Huvudbok</button>
                    <button onClick={() => router.push(`?mode=payments&year=${year}`)} className={`${styles.tab} ${mode === 'payments' ? styles.active : ''}`}>Betalningar</button>
                    <button onClick={() => router.push(`?mode=overview&year=${year}`)} className={`${styles.tab} ${mode === 'overview' ? styles.active : ''}`}>Årsöversikt</button>
                </div>

                {/* Actions Bar with Search and New Expense Button */}
                <div className={styles.actionsBar}>
                    <div className={styles.searchBar}>
                        <Search size={16} className={styles.searchIcon} />
                        <input type="text" placeholder="Sök utlägg..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <button className={styles.primaryAction} onClick={() => router.push(`?mode=excel&year=${year}`)}>
                        <Plus size={18} /> Nytt utlägg
                    </button>
                </div>

                {/* Content Area */}
                <div className={styles.feed}>
                    {/* Settlement Form Modal/Inline */}
                    {showSettlement && (
                        <div className={styles.modalOverlay} onClick={() => setShowSettlement(false)}>
                            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                                <h2>Registrera Betalning</h2>
                                <form onSubmit={handleSettleUp} className={styles.settleForm}>
                                    <select name="to" required defaultValue="" className={styles.input}>
                                        <option value="" disabled>Vem betalade du?</option>
                                        {PARTNERS.filter(n => n !== currentUser).map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                    <input type="number" name="amount" placeholder="Belopp (kr)" required className={styles.input} />
                                    <div className={styles.formActions}>
                                        <button type="button" onClick={() => setShowSettlement(false)} className={styles.btnSecondary}>Avbryt</button>
                                        <button type="submit" disabled={isSavingPayment} className="btn-primary">Spara Betalning</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {mode === 'excel' ? <ExcelMode onSave={() => {
                        fetchData();
                        router.push(`?mode=list&year=${year}`);
                    }} /> : mode === 'overview' ? (
                        <div className={styles.ledgerWrapper}>
                            <table className={styles.ledgerTable}>
                                <thead>
                                    <tr>
                                        <th>Medlem</th>
                                        <th>Utl\u00e4gg</th>
                                        <th>Skuld</th>
                                        <th>Skuldreglering</th>
                                        <th>IB ({year})</th>
                                        <th>Netto Balans</th>
                                        <th>\u00c5tg\u00e4rd</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {PARTNERS.map(name => {
                                        const s = accountingData.partnerStats[name];
                                        const net = s.ib + s.currentPaid - s.currentDebt + s.currentSent - s.currentReceived;
                                        return (
                                            <tr key={name} className={name === currentUser ? styles.currentPartnerRow : ''}>
                                                <td style={{ fontWeight: 600 }}>{name}</td>
                                                <td>{Math.round(s.currentPaid)} kr</td>
                                                <td>-{Math.round(s.currentDebt)} kr</td>
                                                <td style={{ color: s.currentSent > s.currentReceived ? '#10b981' : '#ef4444' }}>
                                                    {Math.round(s.currentSent - s.currentReceived)} kr
                                                </td>
                                                <td>{Math.round(s.ib)} kr</td>
                                                <td className={styles.amount} style={{ color: net > 0 ? '#10b981' : net < 0 ? '#ef4444' : 'inherit' }}>
                                                    {Math.round(net)} kr
                                                </td>
                                                <td>
                                                    {net < 0 && name === currentUser && (
                                                        <button
                                                            className={styles.swishLink}
                                                            onClick={() => alert(`\u00d6ppnar Swish f\u00f6r att betala ${Math.abs(Math.round(net))} kr`)}
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
                                            <td style={{ fontWeight: 500 }}>{exp.description}</td>
                                            <td>{exp.category}</td>
                                            <td>{exp.payerName}</td>
                                            <td className={styles.splitCell}>{exp.participants ? `${exp.participants.length}/3` : "3/3"}</td>
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
                    ) : mode === 'payments' ? (
                        <div className={styles.ledgerWrapper}>
                            <table className={styles.ledgerTable}>
                                <thead>
                                    <tr>
                                        <th>Datum</th>
                                        <th>Från</th>
                                        <th>Till</th>
                                        <th>Belopp</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayments.map(pay => (
                                        <tr key={pay.id}>
                                            <td>{pay.date}</td>
                                            <td>{pay.from.split(' ')[0]}</td>
                                            <td>{pay.to.split(' ')[0]}</td>
                                            <td className={styles.amount}>{Math.round(pay.amount)} kr</td>
                                            <td className={styles.actionsCell}>
                                                <button onClick={() => handleDeletePayment(pay.id!, pay.from)} className={styles.deleteMini}><Trash2 size={14} /></button>
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
                                    <p>Inga utlägg. Dags att segla?</p>
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
            </div>

            {/* Floating Action Button for New Expense */}
            {mode !== 'excel' && (
                <button className={styles.fab} onClick={() => router.push(`?mode=excel&year=${year}`)}>
                    <Plus size={24} color="white" />
                    <span className={styles.fabLabel}>Nytt Utlägg</span>
                </button>
            )}
        </main>
    );
}
