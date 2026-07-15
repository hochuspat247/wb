import type { Metadata } from "next";
import { Inter, Unbounded } from "next/font/google";
import Script from "next/script";
import { BenignNetworkErrorGuard } from "@/components/BenignNetworkErrorGuard";
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

const BENIGN_NETWORK_GUARD_SCRIPT = `(function(){if(window.__mcBenignNetworkGuard)return;window.__mcBenignNetworkGuard=1;function b(m){m=String(m||"");return/failed to fetch|networkerror|load failed|network request failed|gettrackerid|mc\\.yandex|metrika\\/tag\\.js|id\\.vk\\.(ru|com)|vkid_sdk/i.test(m);}var o=console.error.bind(console);console.error=function(){for(var i=0;i<arguments.length;i++){var a=arguments[i];if(b(a&&a.message?a.name+": "+a.message+"\\n"+(a.stack||""):a))return;}return o.apply(console,arguments);};window.addEventListener("unhandledrejection",function(e){var r=e.reason;var m=r&&r.message?r.message:String(r||"");var s=r&&r.stack?r.stack:"";if(b(m+" "+s)){e.preventDefault();e.stopImmediatePropagation();}},true);window.addEventListener("error",function(e){if(b((e.message||"")+" "+(e.filename||""))){e.preventDefault();e.stopImmediatePropagation();}},true);})();`;

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter"
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-unbounded",
  weight: ["500", "600", "700", "800"]
});

export const metadata: Metadata = rootMetadata;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const buildId = process.env.NEXT_BUILD_ID ?? "dev";

  return (
    <html className={`${inter.variable} ${unbounded.variable}`} lang="ru">
      <body className="font-sans antialiased">
        <Script
          id="benign-network-guard"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: BENIGN_NETWORK_GUARD_SCRIPT }}
        />
        <BenignNetworkErrorGuard />
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
