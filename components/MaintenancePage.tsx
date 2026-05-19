import { Cormorant_Garamond } from "next/font/google";
import { Bebas_Neue } from "next/font/google";
import styles from "./MaintenancePage.module.css";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["700"],
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
});

export function MaintenancePage() {
  return (
    <main className={styles.maintenance}>
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.content}>
        <div className={`${styles.title} ${bebasNeue.className}`}>Are you ready for</div>
        <div className={`${styles.more} ${cormorantGaramond.className}`} data-text="MORE">MORE</div>
      </div>
    </main>
  );
}
