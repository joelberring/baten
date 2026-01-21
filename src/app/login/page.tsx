"use client";

import { signIn } from "next-auth/react";
import { Anchor, LogIn } from "lucide-react";
import styles from "./login.module.css";

export default function LoginPage() {
    return (
        <main className={styles.main}>
            <div className={`${styles.loginCard} glass`}>
                <div className={styles.header}>
                    <div className={styles.logo}>
                        <Anchor size={48} color="var(--brass)" />
                    </div>
                    <h1>Logga in på Viggen Utlägg</h1>
                    <p>Använd ditt Google-konto för att få tillgång till båtens loggbok.</p>
                </div>

                <div className={styles.actions}>
                    <button
                        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                        className={styles.googleBtn}
                    >
                        <LogIn size={20} />
                        <span>Logga in med Google</span>
                    </button>
                </div>

                <div className={styles.footer}>
                    <p>Endast inbjudna medlemmar.</p>
                </div>
            </div>
        </main>
    );
}
