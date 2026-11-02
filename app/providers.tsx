"use client";

import { AuthUIProvider } from "@neondatabase/auth/react";
import { InvitationAuthLink } from "@/components/auth/InvitationAuthNavigation";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { invalidateFinancialViews } from "@/lib/auth/financial-visibility";
import { authClient } from "@/lib/auth/client";

export function AuthProviders({ children }: { children: ReactNode }) {
  return (
    <div className="neon-auth-ui">
      <AuthUIProvider
        authClient={authClient}
        // Auth transitions need a fresh document; an overlapping RSC refresh
        // can cancel the post-login navigation in WebKit.
        navigate={(href) => window.location.assign(href)}
        replace={(href) => window.location.replace(href)}
        onSessionChange={() => {
          invalidateFinancialViews({ notifyCurrent: false });
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
