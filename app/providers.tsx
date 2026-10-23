"use client";

import { AuthUIProvider } from "@neondatabase/auth/react";
import { InvitationAuthLink } from "@/components/auth/InvitationAuthNavigation";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { invalidateFinancialViews } from "@/lib/auth/financial-visibility";
import { authClient } from "@/lib/auth/client";

export function AuthProviders({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <div className="neon-auth-ui">
      <AuthUIProvider
        authClient={authClient}
        navigate={(href) => router.push(href)}
        replace={(href) => router.replace(href)}
        onSessionChange={() => {
          invalidateFinancialViews({ notifyCurrent: false });
          router.refresh();
        }}
        redirectTo="/"
        Link={InvitationAuthLink}
        credentials={{ forgotPassword: true }}
        magicLink={false}
        multiSession={false}
        apiKey={false}
        passkey={false}
        oneTap={false}
      >
        {children}
        <Toaster theme="light" />
      </AuthUIProvider>
    </div>
  );
}
