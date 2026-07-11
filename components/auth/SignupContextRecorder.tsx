"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { recordSignupContext } from "@/lib/auth/signup-context-client";

export function SignupContextRecorder() {
  const { status } = useSession();
  const recordedRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || recordedRef.current) {
      return;
    }

    recordedRef.current = true;
    void recordSignupContext({
      callbackUrl: `${window.location.pathname}${window.location.search}`
    });
  }, [status]);

  return null;
}
