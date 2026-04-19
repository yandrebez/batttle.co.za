"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SideMenu } from "@/components/SideMenu";
import type { CSSProperties } from "react";

type AppShellProps = {
  children: React.ReactNode;
};

const MENU_OPEN_KEY = "battle_menu_open";

type ShellSettings = {
  menuBackgroundColor: string;
  headerRowColor: string;
};

const defaultShellSettings: ShellSettings = {
  menuBackgroundColor: "#ffffff",
  headerRowColor: "#ffffff",
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [shellSettings, setShellSettings] = useState<ShellSettings>(defaultShellSettings);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(MENU_OPEN_KEY);
    if (stored === "0") {
      setIsMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        const data = (await response.json()) as {
          settings?: Partial<ShellSettings>;
        };

        if (!response.ok || !data.settings || !isMounted) {
          return;
        }

        const menuBackgroundColor =
          typeof data.settings.menuBackgroundColor === "string" && /^#[0-9a-fA-F]{6}$/.test(data.settings.menuBackgroundColor)
            ? data.settings.menuBackgroundColor
            : defaultShellSettings.menuBackgroundColor;

        const headerRowColor =
          typeof data.settings.headerRowColor === "string" && /^#[0-9a-fA-F]{6}$/.test(data.settings.headerRowColor)
            ? data.settings.headerRowColor
            : defaultShellSettings.headerRowColor;

        setShellSettings({ menuBackgroundColor, headerRowColor });
      } catch {
        // Keep defaults on any fetch failure.
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const shellStyle = {
    "--menu-bg": shellSettings.menuBackgroundColor,
    "--topbar-bg": shellSettings.headerRowColor,
  } as CSSProperties;

  const toggleMenu = () => {
    const next = !isMenuOpen;
    setIsMenuOpen(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MENU_OPEN_KEY, next ? "1" : "0");
    }
  };

  if (isLandingPage) {
    return (
      <div className="appShell landingShell" style={shellStyle}>
        <div className="contentShell">
          <main className="workspace">
            <div className="workspaceInner">{children}</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`appShell ${isMenuOpen ? "menuOpen" : "menuClosed"}`} style={shellStyle}>
      <SideMenu />

      <div className="contentShell">
        <header className="appTopBar" aria-label="Top bar">
          <button
            type="button"
            className="menuToggle menuToggleIcon"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>

          <h1 className="appTopTitle">Batttle</h1>

          <Link href="/cart" className="topCartButton" aria-label="Cart">
            <span aria-hidden="true">🛒</span>
          </Link>
        </header>

        <main className="workspace">
          <div className="workspaceInner">{children}</div>
        </main>
      </div>
    </div>
  );
}