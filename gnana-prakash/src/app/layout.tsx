import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/shared/QueryProvider";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "TRMS", template: "%s | TRMS" },
  description: "Training Management & Monitoring System — Department of School Education, Andhra Pradesh",
  keywords: ["training", "management", "teachers", "government", "Andhra Pradesh"],
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} font-sans`} suppressHydrationWarning>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
