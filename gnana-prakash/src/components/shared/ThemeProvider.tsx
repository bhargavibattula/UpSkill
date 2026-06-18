"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const errorStr = args.map(arg => (typeof arg === "string" ? arg : String(arg))).join(" ");
    if (
      errorStr.includes("Encountered a script tag while rendering React component") ||
      errorStr.includes("fdprocessedid")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
