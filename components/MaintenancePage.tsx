import { Cinzel } from "next/font/google";
import styles from "./MaintenancePage.module.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["700"],
});

export function MaintenancePage() {
  return (
    <main className={styles.maintenance}>
      <div className={styles.content}>
        <div className={styles.title}>Are you ready for</div>
        <div className={`${styles.more} ${cinzel.className}`}>MORE</div>
      </div>
    </main>
  );
}
