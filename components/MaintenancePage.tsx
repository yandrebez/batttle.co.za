import styles from "./MaintenancePage.module.css";

export function MaintenancePage() {
  return (
    <main className={styles.maintenance}>
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.content}>
        <img
          src="/maintenance-words.svg"
          alt="Are you ready for MORE"
          className={styles.wordsImage}
        />
      </div>
    </main>
  );
}
