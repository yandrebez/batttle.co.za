"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getCurrencySymbol } from "@/lib/currency";

const CurrencyContext = createContext<string>("$");

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [symbol, setSymbol] = useState("$");

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const res = await fetch("/api/settings");
        const data = (await res.json()) as {
          settings?: { currencyCode?: string };
        };

        if (isMounted && data.settings?.currencyCode) {
          setSymbol(getCurrencySymbol(data.settings.currencyCode));
        }
      } catch {
        // Keep default "$" on failure.
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return <CurrencyContext.Provider value={symbol}>{children}</CurrencyContext.Provider>;
}

export function useCurrencySymbol(): string {
  return useContext(CurrencyContext);
}
