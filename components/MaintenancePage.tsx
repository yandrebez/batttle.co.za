import Image from "next/image";
import styles from "./MaintenancePage.module.css";

export function MaintenancePage() {
  return (
    <main className={styles.maintenance}>
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.content}>
        <Image
          src="/maintenance-words.png"
          alt="Are you ready for MORE"
          width={1100}
          height={420}
          priority
          className={styles.wordsImage}
        />
      </div>
    </main>
  );
}
