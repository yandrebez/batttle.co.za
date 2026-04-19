"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

const primaryItems = [
  { href: "/shop", label: "Shop" },
  { href: "/orders", label: "Orders" },
];

export function SideMenu() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  const isAdmin = user?.role === "ADMIN";

  return (
    <aside className="sideMenu" aria-label="Main navigation">
      <div className="sideMenuBrand">
        <p className="sideMenuEyebrow">Battle Store</p>
        <h1>Control Panel</h1>
      </div>

      <nav className="sideMenuNav" aria-label="Primary">
        {primaryItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sideMenuLink ${isActive ? "sideMenuLinkActive" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sideMenuSectionLabel">Account</div>
      <nav className="sideMenuNav" aria-label="Account">
        <Link
          href="/profile"
          className={`sideMenuLink ${pathname === "/profile" ? "sideMenuLinkActive" : ""}`}
        >
          {isLoading ? "Account" : user ? "Profile" : "Sign In"}
        </Link>

        {isAdmin ? (
          <Link
            href="/admin"
            className={`sideMenuLink ${pathname.startsWith("/admin") ? "sideMenuLinkActive" : ""}`}
          >
            Admin
          </Link>
        ) : null}
      </nav>
    </aside>
  );
}