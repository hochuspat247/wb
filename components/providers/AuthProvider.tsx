"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { SignupContextRecorder } from "@/components/auth/SignupContextRecorder";

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SignupContextRecorder />
      {children}
    </SessionProvider>
  );
}
