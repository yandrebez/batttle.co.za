"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

const primaryItems = [
  { href: "/", label: "Home", isActive: (pathname: string) => pathname === "/" },
  { href: "/#products", label: "Products", isActive: () => false },
  { href: "/orders", label: "Orders", isActive: (pathname: string) => pathname === "/orders" },
];

export function SideMenu() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  const isAdmin = user?.role === "ADMIN";

  return (
    <aside className="sideMenu" aria-label="Main navigation">
      <div className="sideMenuBrand">
        <p className="sideMenuEyebrow">Battle Store</p>
        <h1>BATTTLE</h1>
      </div>

      <nav className="sideMenuNav" aria-label="Primary">
        {primaryItems.map((item) => {
          const isActive = item.isActive(pathname);
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
      </nav>

      {isAdmin ? (
        <>
          <div className="sideMenuSectionLabel">Management</div>
          <nav className="sideMenuNav" aria-label="Management">
          <Link
            href="/admin"
            className={`sideMenuLink ${pathname.startsWith("/admin") ? "sideMenuLinkActive" : ""}`}
          >
            Admin
          </Link>
          </nav>
        </>
      ) : null}
    </aside>
  );
}