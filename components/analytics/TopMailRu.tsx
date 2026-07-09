"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

const TOP_MAIL_RU_COUNTER_ID = process.env.NEXT_PUBLIC_TOP_MAIL_RU_ID || "3778727";

function TopMailRuPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousUrlRef = useRef<string | null>(typeof window === "undefined" ? null : window.location.href);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!TOP_MAIL_RU_COUNTER_ID) return;

    const nextUrl = window.location.href;
    const previousUrl = previousUrlRef.current;

    previousUrlRef.current = nextUrl;

    if (!previousUrl || previousUrl === nextUrl) return;

    const tmr = window._tmr || (window._tmr = []);
    tmr.push({ id: TOP_MAIL_RU_COUNTER_ID, type: "pageView", start: new Date().getTime() });
  }, [pathname, searchParams]);

  return null;
}

export function TopMailRu() {
  if (!TOP_MAIL_RU_COUNTER_ID) return null;

  return (
    <>
      <Script
        id="top-mail-ru"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
var _tmr = window._tmr || (window._tmr = []);
_tmr.push({id: "${TOP_MAIL_RU_COUNTER_ID}", type: "pageView", start: (new Date()).getTime()});
(function (d, w, id) {
  if (d.getElementById(id)) return;
  var ts = d.createElement("script"); ts.type = "text/javascript"; ts.async = true; ts.id = id;
  ts.src = "https://top-fwz1.mail.ru/js/code.js";
  var f = function () {var s = d.getElementsByTagName("script")[0]; s.parentNode.insertBefore(ts, s);};
  if (w.opera == "[object Opera]") { d.addEventListener("DOMContentLoaded", f, false); } else { f(); }
})(document, window, "tmr-code");
          `
        }}
      />
      <Suspense fallback={null}>
        <TopMailRuPageView />
      </Suspense>
      <noscript>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://top-fwz1.mail.ru/counter?id=${TOP_MAIL_RU_COUNTER_ID};js=na`}
            style={{ position: "absolute", left: "-9999px" }}
            alt="Top.Mail.Ru"
          />
        </div>
      </noscript>
    </>
  );
}
