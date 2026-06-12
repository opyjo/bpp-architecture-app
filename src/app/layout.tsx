import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Subscription Manager \u2014 Architecture",
  description: "Bell Canada \u00b7 go-repo-new \u00b7 Next.js 14 BFF \u2192 AppSync \u2192 Go microservices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-arch-bg text-arch-text font-sans antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
