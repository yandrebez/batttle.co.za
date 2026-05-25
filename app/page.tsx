import Link from "next/link";
import { ProductCatalog } from "@/components/ProductCatalog";
import { LandingVideoCarousel } from "@/components/LandingVideoCarousel";
import { getSiteSettings } from "@/lib/siteSettings";
import { APP_VERSION_LABEL } from "@/lib/version";
import { MaintenancePage } from "@/components/MaintenancePage";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getSiteSettings();

  // Show maintenance page if maintenance mode is enabled
  if (settings.maintenanceMode) {
    return <MaintenancePage />;
  }

  return (
    <main id="landing-top" className={styles.page}>
      <div className={styles.shell}>
        <section id="home" className={styles.hero}>
          <div className={styles.copyColumn}>
            <p className={styles.eyebrow}>Online Shopping, Made Sharper</p>
            <h1 className={styles.title}>
              BATTTLE STORE <span className={styles.versionTag}>{APP_VERSION_LABEL}</span>
            </h1>
            <p className={styles.subtitle}>
              One continuous storefront flow. Scroll and use menu anchors to move through sections instantly.
            </p>

            <div className={styles.actions}>
              <Link href="#products" className={styles.shopButton}>
                Explore products
              </Link>
              <Link href="/profile" className={styles.secondaryButton}>
                Account
              </Link>
            </div>
          </div>
        </section>

        <section id="media" className={styles.mediaSection}>
          <LandingVideoCarousel rawVideoValue={settings.landingVideoUrl} />
        </section>

        <ProductCatalog
          sectionId="products"
          eyebrow="Latest Drop"
          title="Shop the Catalog"
          description="Scroll straight into the live store inventory, then tap the BATTTLE logo any time to jump back to the landing section."
          variant="landing"
        />
      </div>
    </main>
  );
}
