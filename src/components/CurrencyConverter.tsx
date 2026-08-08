"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { DollarSign, ChevronDown } from "lucide-react";

interface CurrencyRate {
  code: string;
  symbol: string;
  name: string;
  rate: number; // rate relative to GBP
}

const currencies: CurrencyRate[] = [
  { code: "GBP", symbol: "£", name: "British Pound", rate: 1 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 1.17 },
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1.27 },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", rate: 41.5 },
  { code: "RUB", symbol: "₽", name: "Russian Ruble", rate: 115 },
  { code: "IRR", symbol: "﷼", name: "Iranian Rial", rate: 53500 },
];

interface CurrencyContextType {
  currency: CurrencyRate;
  setCurrency: (currency: CurrencyRate) => void;
  convert: (amount: number, fromCurrency?: string) => number;
  format: (amount: number, fromCurrency?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: currencies[0],
  setCurrency: () => {},
  convert: (amount) => amount,
  format: (amount) => `£${amount.toLocaleString()}`,
});

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyRate>(currencies[0]);

  useEffect(() => {
    const saved = localStorage.getItem("preferred_currency");
    if (saved) {
      const found = currencies.find((c) => c.code === saved);
      if (found) setCurrencyState(found);
    }
  }, []);

  const setCurrency = (newCurrency: CurrencyRate) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("preferred_currency", newCurrency.code);
  };

  const convert = (amount: number, fromCurrency = "GBP"): number => {
    const fromRate = currencies.find((c) => c.code === fromCurrency)?.rate || 1;
    const amountInGBP = amount / fromRate;
    return amountInGBP * currency.rate;
  };

  const format = (amount: number, fromCurrency = "GBP"): string => {
    const converted = convert(amount, fromCurrency);
    
    // Format based on currency
    if (currency.code === "IRR") {
      return `${currency.symbol}${Math.round(converted / 1000000)}M`;
    }
    
    return `${currency.symbol}${Math.round(converted).toLocaleString()}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-600 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
      >
        <DollarSign className="w-4 h-4" />
        <span className="font-medium">{currency.code}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
            {currencies.map((cur) => (
              <button
                key={cur.code}
                onClick={() => {
                  setCurrency(cur);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between ${
                  currency.code === cur.code
                    ? "text-primary font-semibold bg-primary-light"
                    : "text-gray-700"
                }`}
              >
                <span>
                  {cur.symbol} {cur.code}
                </span>
                <span className="text-xs text-gray-400">{cur.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
