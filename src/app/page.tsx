import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { Anchor } from "lucide-react";

export default function Home() {
  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <Anchor size={28} color="var(--viggen-orange)" />
          <span>Viggen Utlägg</span>
        </div>
        <div className={styles.navLinks}>
          <Link href="/login">Logga in</Link>
        </div>
      </nav>

      <div className={styles.content}>
        <div className={styles.illustrations}>
          <div className={styles.imageWrapper}>
            <Image
              src="/assets/viggen_boat_lineart.png"
              alt="Albin Viggen Line Art"
              width={600}
              height={600}
              className={styles.illustration}
              priority
            />
          </div>
        </div>

        <h1 className={styles.title}>Bokföring för din <span className={styles.highlight}>Albin Viggen</span></h1>
      </div>
    </main>
  );
}
