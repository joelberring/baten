import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Anchor, Plus, TrendingUp, TrendingDown, Table as TableIcon, List, ArrowRight } from "lucide-react";
import styles from "./dashboard.module.css";
import ExpenseItem from "@/components/expenses/ExpenseItem";
import ExcelMode from "@/components/excel/ExcelMode";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ mode?: string, year?: string }> }) {
    const session = await getServerSession(authOptions);
    const resolvedParams = await searchParams;
    const mode = resolvedParams.mode || "list";
    const year = resolvedParams.year || "2026";

    if (!session) {
        redirect("/login");
    }

    const years = ["2026", "2025"];

    const mockExpenses = [
        { id: '1', description: 'Hamnavgift Sandhamn', amount: 450, category: 'Hamnavgift', payerName: 'Joel', date: '2026-07-10', commentCount: 2 },
        { id: '2', description: 'Diesel 60L', amount: 1200, category: 'Bränsle', payerName: 'Erik', date: '2026-07-12', commentCount: 0 },
        { id: '3', description: 'Nya fendrar (4st)', amount: 800, category: 'Underhåll', payerName: 'Anna', date: '2026-07-15', commentCount: 1 },
    ];

    const mockExpenses2025 = [
        { id: '4', description: 'Vinterförvaring', amount: 5000, category: 'Underhåll', payerName: 'Anna', date: '2025-11-01', commentCount: 1 },
        { id: '5', description: 'Bottenfärg', amount: 1500, category: 'Underhåll', payerName: 'Erik', date: '2025-04-20', commentCount: 2 },
    ];

    const currentExpenses = year === "2026" ? mockExpenses : mockExpenses2025;

    const mockPayments = [
        { from: "Erik", to: "Anna", amount: 1200, status: "Slutförd", date: "2026-01-15" }
    ];

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div className={styles.logo}>
                    <Anchor size={24} color="var(--brass)" />
                    <span>Viggen Utlägg</span>
                </div>

                <nav className={styles.yearNav}>
                    {years.map(y => (
                        <a
                            key={y}
                            href={`?year=${y}&mode=${mode}`}
                            className={`${styles.yearLink} ${year === y ? styles.activeYear : ''}`}
                        >
                            {y}
                        </a>
                    ))}
                </nav>

                <div className={styles.user}>
                    <span>Välkommen, {session.user?.name}</span>
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
                                    <strong>{year === "2026" ? "450" : "2,500"} SEK</strong>
                                </div>
                            </div>
                            <div className={styles.statItem}>
                                <TrendingDown color="#ef4444" />
                                <div>
                                    <p>Att betala</p>
                                    <strong>{year === "2026" ? "667" : "0"} SEK</strong>
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
                                <button className={styles.payBtn}>Betala</button>
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
                            <a href={`?mode=list&year=${year}`} className={`${styles.tab} ${mode === 'list' ? styles.active : ''}`}>
                                <List size={18} /> Loggbok
                            </a>
                            <a href={`?mode=excel&year=${year}`} className={`${styles.tab} ${mode === 'excel' ? styles.active : ''}`}>
                                <TableIcon size={18} /> Excel-läge
                            </a>
                        </div>
                        <button className="btn-brass"><Plus size={18} /> Nytt utlägg</button>
                    </div>

                    <div className={styles.content}>
                        {mode === 'excel' ? (
                            <ExcelMode />
                        ) : (
                            <div className={styles.expenseList}>
                                {currentExpenses.map(exp => (
                                    <ExpenseItem key={exp.id} expense={exp} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
