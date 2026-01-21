import Link from "next/link";
import styles from "./page.module.css";
import { Anchor, Calculator, Table, FileText, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <div className={styles.overlay}></div>
        <nav className={styles.nav}>
          <div className={styles.logo}>
            <Anchor size={32} color="var(--brass)" />
            <span>Viggen Utlägg</span>
          </div>
          <div className={styles.navLinks}>
            <Link href="/login" className="btn-brass">Logga in</Link>
          </div>
        </nav>

        <section className={styles.heroContent}>
          <h1 className={styles.title}>Bokföring för din <span className={styles.highlight}>Albin Viggen</span></h1>
          <p className={styles.subtitle}>
            Dela på kostnaderna, inte på vänskapen. Enkel utläggshantering för båtägare.
          </p>

          <div className={styles.features}>
            <div className={`${styles.featureCard} glass`}>
              <Calculator className={styles.icon} />
              <h3>Settle Up</h3>
              <p>Räkna ut vem som är skyldig vem med ett klick.</p>
            </div>
            <div className={`${styles.featureCard} glass`}>
              <Table className={styles.icon} />
              <h3>Excel-läge</h3>
              <p>Full kontroll och bulkredigering direkt i tabellen.</p>
            </div>
            <div className={`${styles.featureCard} glass`}>
              <FileText className={styles.icon} />
              <h3>Årsbokslut</h3>
              <p>Färdiga rapporter för hela säsongens ekonomi.</p>
            </div>
          </div>

          <div className={styles.cta}>
            <Link href="/login" className={styles.primaryBtn}>
              Kom igång nu <ChevronRight size={20} />
            </Link>
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Viggen Utlägg. För gänget på böljan den blå.</p>
      </footer>
    </main>
  );
}
