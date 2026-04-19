import Link from "next/link";
import type { CSSProperties } from "react";
import { getSiteSettings } from "@/lib/siteSettings";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getSiteSettings();
  const pageStyle = { "--landing-bg-base": settings.siteBackgroundColor } as CSSProperties;

  return (
    <main className={styles.page} style={pageStyle}>
      <section className={styles.hero}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Online Shopping, Made Easy</p>
          <h1 className={styles.title}>Battle Store</h1>
          <p className={styles.subtitle}>Fast deals, trusted brands, and a clean shopping flow from browse to checkout.</p>
          <div className={styles.actions}>
            <Link href="/shop" className={styles.shopButton}>
              Shop now
            </Link>
            <Link href="/profile" className={styles.secondaryButton}>
              My account
            </Link>
          </div>
        </header>

        <section className={styles.mediaSection}>
          {settings.landingVideoUrl ? (
            <video
              key={settings.landingVideoUrl}
              src={settings.landingVideoUrl}
              className={styles.videoPlayer}
              controls
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <div className={styles.videoPlaceholder}>Featured campaign video appears here.</div>
          )}
        </section>
      </section>
    </main>
  );
}
