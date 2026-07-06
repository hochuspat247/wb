import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { VkIdCallbackHandler } from "@/components/auth/VkIdCallbackHandler";
import { VkIdFloatingGate } from "@/components/auth/VkIdFloatingGate";
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
          <VkIdCallbackHandler />
          <VkIdFloatingGate />
        </AuthProvider>
      </body>
    </html>
  );
}
