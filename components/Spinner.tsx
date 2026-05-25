import styles from "./Spinner.module.css";

type SpinnerProps = {
  label?: string;
  fullPage?: boolean;
};

export function Spinner({ label = "Loading...", fullPage = false }: SpinnerProps) {
  return (
    <div className={fullPage ? styles.fullPage : styles.inline} role="status" aria-live="polite">
      <div className={styles.spinner} aria-hidden="true" />
      <p className={styles.label}>{label}</p>
    </div>
  );
}