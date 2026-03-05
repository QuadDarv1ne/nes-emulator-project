import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "NES Emulator | Maestro7IT",
  description: "Веб-эмулятор Nintendo Entertainment System (NES). Обучающий проект школы программирования Maestro7IT.",
  keywords: ["NES", "Emulator", "Nintendo", "React", "Next.js", "Maestro7IT", "эмулятор", "игры"],
  authors: [{ name: "Дуплей Максим Игоревич | Школа программирования Maestro7IT" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "NES Emulator | Maestro7IT",
    description: "Веб-эмулятор NES с современным UI",
    url: "https://github.com/yourusername/nes-emulator-project",
    siteName: "NES Emulator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NES Emulator | Maestro7IT",
    description: "Веб-эмулятор NES с современным UI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <I18nProvider>
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
