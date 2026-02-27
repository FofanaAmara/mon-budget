'use client';

import { NeonAuthUIProvider } from '@neondatabase/auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { authClient } from '@/lib/auth/client';

export function AuthProviders({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <NeonAuthUIProvider
      authClient={authClient as any}
      navigate={(href) => router.push(href)}
      replace={(href) => router.replace(href)}
      onSessionChange={() => router.refresh()}
      redirectTo="/"
      Link={Link}
      credentials={{ forgotPassword: true }}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
