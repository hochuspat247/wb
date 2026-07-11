"use client";

import { useEffect } from "react";
import { StaleClientOverlay } from "@/components/StaleClientOverlay";
import {
  isStaleClientError,
  reloadPageForFreshClient
} from "@/lib/client/staleClientErrors";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const staleClient = isStaleClientError(error.message, error.stack);

  if (staleClient) {
    return (
      <html lang="ru">
        <body>
          <StaleClientOverlay onRefresh={reloadPageForFreshClient} />
        </body>
      </html>
    );
  }

  return (
    <html lang="ru">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body {
                margin: 0;
                color: #F5F7FB;
                font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
                background:
                  radial-gradient(circle at 15% 0%, rgba(140, 123, 255, 0.16), transparent 34%),
                  #0B0D12;
              }
            `
          }}
        />
      </head>
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px"
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: "32px 28px",
              borderRadius: "24px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              background: "rgba(255, 255, 255, 0.05)",
              textAlign: "center"
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#8C7BFF"
              }}
            >
              Ошибка
            </p>
            <h1 style={{ margin: "16px 0 0", fontSize: "24px", fontWeight: 700 }}>Что-то пошло не так</h1>
            <p style={{ margin: "12px 0 0", fontSize: "14px", lineHeight: 1.7, color: "rgba(245, 247, 251, 0.72)" }}>
              Страница столкнулась с ошибкой. Попробуйте обновить — ваши данные и генерации сохранены.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: "24px",
                width: "100%",
                height: "44px",
                border: "none",
                borderRadius: "999px",
                background: "#8C7BFF",
                color: "#0B0D12",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer"
              }}
              type="button"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
