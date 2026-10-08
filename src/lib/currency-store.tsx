import { createContext, useContext, type ReactNode } from "react";
import type { Currency } from "@/lib/pricing";

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

/** The marketplace operates in France: EUR is the only currency. */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  return (
    <CurrencyContext.Provider
      value={{
        currency: "eur",
        setCurrency: () => {
          /* EUR only — no switching */
        },
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
