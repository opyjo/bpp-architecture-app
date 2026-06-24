import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import AppChrome from "@/components/AppChrome";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "conduit-architecture",
  description: "Architecture workspace · go-repo-new · BFF → AppSync → Go microservices",
  applicationName: "conduit-architecture",
  appleWebApp: {
    capable: true,
    title: "conduit",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1117" },
  ],
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
          <AppChrome>{children}</AppChrome>
          <Toaster position="bottom-right" richColors theme="system" />
        </ThemeProvider>
      </body>
    </html>
  );
}
