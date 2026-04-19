"use client";

import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { Spinner } from "@/components/Spinner";
import styles from "./page.module.css";

export default function ProfilePage() {
  const { user, isLoading, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  if (isLoading) {
    return (
      <main className={styles.page}>
        <section className={styles.section}>
          <div className={styles.loadingState}>
            <Spinner label="Loading profile..." />
          </div>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.page}>
        <section className={styles.section}>
          <div className={styles.headingWrap}>
            <p className={styles.eyebrow}>Profile</p>
            <h1>Welcome</h1>
            <p>Sign in to your account to access your profile and order history.</p>
          </div>

          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className={styles.signUpBtn}
          >
            Sign In / Sign Up
          </button>
        </section>

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.section}>
        <div className={styles.headingWrap}>
          <p className={styles.eyebrow}>Profile</p>
          <h1>Your Profile</h1>
          <p>Manage your account settings.</p>
        </div>

        <article className={styles.card}>
          <h2>Account Information</h2>

          <div className={styles.row}>
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>

          <div className={styles.row}>
            <span>Role</span>
            <strong>{user.role}</strong>
          </div>

          <div className={styles.row}>
            <span>User ID</span>
            <code>{user.id}</code>
          </div>
        </article>

        <button type="button" onClick={logout} className={styles.logoutBtn}>
          Logout
        </button>
      </section>
    </main>
  );
}
