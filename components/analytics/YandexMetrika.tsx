"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

const COUNTER_ID = 110476730;

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
  }
}

function YandexMetrikaPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousUrlRef = useRef<string | null>(typeof window === "undefined" ? null : window.location.href);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.ym !== "function") return;

    const nextUrl = window.location.href;
    const previousUrl = previousUrlRef.current;

    previousUrlRef.current = nextUrl;

    if (!previousUrl || previousUrl === nextUrl) return;

    window.ym(COUNTER_ID, "hit", nextUrl, {
      referrer: previousUrl
    });
  }, [pathname, searchParams]);

  return null;
}

export function YandexMetrika() {
  return (
    <>
      <Script
        id="yandex-metrika"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {
                if (document.scripts[j].src === r) { return; }
              }
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=${COUNTER_ID}", "ym");

            ym(${COUNTER_ID}, "init", {
              ssr: true,
              webvisor: true,
              clickmap: true,
              ecommerce: "dataLayer",
              referrer: document.referrer,
              url: location.href,
              accurateTrackBounce: true,
              trackLinks: true
            });
          `
        }}
      />
      <Suspense fallback={null}>
        <YandexMetrikaPageView />
      </Suspense>
      <noscript>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://mc.yandex.ru/watch/${COUNTER_ID}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
