"use client";

import { useRef } from "react";
import Script from "next/script";

type SmartCaptchaProps = {
  onToken: (token: string) => void;
};

type SmartCaptchaApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
    }
  ) => void;
};

declare global {
  interface Window {
    smartCaptcha?: SmartCaptchaApi;
  }
}

const CLIENT_KEY = process.env.NEXT_PUBLIC_YANDEX_SMARTCAPTCHA_CLIENT_KEY || "";
const SCRIPT_URL = "https://smartcaptcha.cloud.yandex.ru/captcha.js";

export function isSmartCaptchaEnabled() {
  return CLIENT_KEY.length > 0;
}

export function SmartCaptcha({ onToken }: SmartCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  function renderCaptcha() {
    if (!CLIENT_KEY || renderedRef.current || !containerRef.current || !window.smartCaptcha) {
      return;
    }

    renderedRef.current = true;

    window.smartCaptcha.render(containerRef.current, {
      sitekey: CLIENT_KEY,
      callback: onToken
    });
  }

  if (!CLIENT_KEY) {
    return null;
  }

  return (
    <>
      <Script src={SCRIPT_URL} strategy="afterInteractive" onLoad={renderCaptcha} />
      <div ref={containerRef} className="smart-captcha" />
    </>
  );
}
