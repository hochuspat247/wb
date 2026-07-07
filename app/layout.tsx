import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { YandexMetrika } from "@/components/analytics/YandexMetrika";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { VkIdCallbackHandler } from "@/components/auth/VkIdCallbackHandler";
import { rootMetadata } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter"
});

export const metadata: Metadata = rootMetadata;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={inter.variable} lang="ru">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <AnalyticsTracker />
          <YandexMetrika />
          <VkIdCallbackHandler />
        </AuthProvider>
      </body>
    </html>
  );
}
