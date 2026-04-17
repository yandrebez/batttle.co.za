import Link from "next/link";
import { getServerAuth } from "@/lib/server-auth";
import { LogoutButton } from "@/components/logout-button";

export async function AuthNav() {
  const auth = await getServerAuth();

  return (
    <header className="topbar">
      <nav className="topbar-inner">
        <Link href="/" className="brand">
          Batttle Shop
        </Link>
        <div className="nav-links">
          <Link href="/">Shop</Link>
          <Link href="/profile">Profile</Link>
          {auth?.role === "ADMIN" && <Link href="/admin">Admin</Link>}
        </div>
        <div className="auth-area">
          {auth ? (
            <>
              <span className="role-chip">{auth.role}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="ghost-btn">
                Login
              </Link>
              <Link href="/register" className="solid-btn">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
