"use client";

type Props = {
  onRefresh: () => void;
};

export function StaleClientOverlay({ onRefresh }: Props) {
  return (
    <div
      aria-labelledby="stale-client-title"
      aria-modal="true"
      role="alertdialog"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "rgba(11, 13, 18, 0.94)",
        backdropFilter: "blur(10px)",
        fontFamily: 'var(--font-inter, system-ui, -apple-system, "Segoe UI", sans-serif)'
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
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.45)",
          color: "#F5F7FB",
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
          Нужно обновление
        </p>
        <h2
          id="stale-client-title"
          style={{
            margin: "16px 0 0",
            fontSize: "24px",
            fontWeight: 700,
            lineHeight: 1.25
          }}
        >
          Обновите страницу
        </h2>
        <p
          style={{
            margin: "12px 0 0",
            fontSize: "14px",
            lineHeight: 1.7,
            color: "rgba(245, 247, 251, 0.72)"
          }}
        >
          Похоже, у вас проблемы с интернетом — или сайт только что обновился. Нажмите «Обновить», ваши данные
          сохранены.
        </p>
        <button
          onClick={onRefresh}
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
          Обновить страницу
        </button>
      </div>
    </div>
  );
}
