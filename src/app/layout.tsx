import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import Header from "@/components/Header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Subscription Manager — Architecture",
  description: "Bell Canada · go-repo-new · Next.js 14 BFF → AppSync → Go microservices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-arch-bg text-arch-text font-sans antialiased">
        <ThemeProvider>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
