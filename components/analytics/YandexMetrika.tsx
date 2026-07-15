"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { trackPageView, YANDEX_METRIKA_ID } from "@/lib/metrika";

function YandexMetrikaPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousUrlRef = useRef<string | null>(typeof window === "undefined" ? null : window.location.href);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const nextUrl = window.location.href;
      const previousUrl = previousUrlRef.current;

      previousUrlRef.current = nextUrl;

      if (!previousUrl || previousUrl === nextUrl) return;

      trackPageView(nextUrl);
    } catch {
      // Metrika failures must not affect navigation.
    }
  }, [pathname, searchParams]);

  return null;
}

export function YandexMetrika() {
  if (!YANDEX_METRIKA_ID) return null;

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
            })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_ID}", "ym");

            try {
              ym(${YANDEX_METRIKA_ID}, "init", {
                ssr: true,
                webvisor: true,
                clickmap: true,
                ecommerce: "dataLayer",
                referrer: document.referrer,
                url: location.href,
                accurateTrackBounce: true,
                trackLinks: true
              });
            } catch (e) {}
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
            src={`https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
