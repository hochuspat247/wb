import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { HashViewTracker } from "@/components/analytics/HashViewTracker";
import { PresenceTracker } from "@/components/analytics/PresenceTracker";
import { SectionViewTracker } from "@/components/analytics/SectionViewTracker";
import { CookieBanner } from "@/components/CookieBanner";
import { TopMailRu } from "@/components/analytics/TopMailRu";
import { YandexMetrika } from "@/components/analytics/YandexMetrika";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { DeploymentRefreshGuard } from "@/components/DeploymentRefreshGuard";
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
  const buildId = process.env.NEXT_BUILD_ID ?? "dev";

  return (
    <html className={inter.variable} lang="ru">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <DeploymentRefreshGuard initialBuildId={buildId} />
          <AnalyticsTracker />
          <SectionViewTracker />
          <HashViewTracker />
          <PresenceTracker />
          <YandexMetrika />
          <TopMailRu />
          <VkIdCallbackHandler />
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
