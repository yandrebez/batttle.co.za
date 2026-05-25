"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SideMenu } from "@/components/SideMenu";
import type { CSSProperties } from "react";
import { APP_VERSION_LABEL } from "@/lib/version";

type AppShellProps = {
  children: React.ReactNode;
  initialMaintenanceMode?: boolean;
};

const MENU_OPEN_KEY = "battle_menu_open";

type ShellSettings = {
  menuBackgroundColor: string;
  headerRowColor: string;
  logoUrl: string;
  maintenanceMode: boolean;
};

const defaultShellSettings: ShellSettings = {
  menuBackgroundColor: "#ffffff",
  headerRowColor: "#ffffff",
  logoUrl: "",
  maintenanceMode: false,
};

export function AppShell({ children, initialMaintenanceMode = false }: AppShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [shellSettings, setShellSettings] = useState<ShellSettings>({
    ...defaultShellSettings,
    maintenanceMode: initialMaintenanceMode,
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(MENU_OPEN_KEY);
    if (stored === "0") {
      window.setTimeout(() => {
        setIsMenuOpen(false);
      }, 0);
    }

    let isMounted = true;

    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
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

        const logoUrl =
          typeof data.settings.logoUrl === "string"
            ? data.settings.logoUrl.trim()
            : defaultShellSettings.logoUrl;

        const maintenanceMode =
          typeof data.settings.maintenanceMode === "boolean"
            ? data.settings.maintenanceMode
            : defaultShellSettings.maintenanceMode;

        setShellSettings({ menuBackgroundColor, headerRowColor, logoUrl, maintenanceMode });
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

  return (
    <div className={`appShell ${isMenuOpen ? "menuOpen" : "menuClosed"}`} style={shellStyle}>
      <SideMenu />

      <div className="contentShell">
        {!shellSettings.maintenanceMode && (
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

            <Link href="/" className="appTopBrand" aria-label="Go to home">
              <div className="appTopLogoSpot" aria-hidden="true">
                {shellSettings.logoUrl ? (
                  <img src={shellSettings.logoUrl} alt="" className="appTopLogoImage" />
                ) : (
                  <span className="appTopLogoFallback">B</span>
                )}
              </div>
              <h1 className="appTopTitle">BATTTLE <span className="appVersionTag">{APP_VERSION_LABEL}</span></h1>
            </Link>

            <div className="appTopActions">
              <Link href="/cart" className="topCartButton" aria-label="Cart">
                <span aria-hidden="true">🛒</span>
              </Link>
            </div>
          </header>
        )}

        <main className="workspace">
          <div className="workspaceInner">{children}</div>
        </main>
      </div>
    </div>
  );
}