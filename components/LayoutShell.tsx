'use client';

import { usePathname } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth') || pathname.startsWith('/account');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <BottomNav />
      <div className="md:ml-[240px]">
        <div className="max-w-lg mx-auto md:max-w-2xl min-h-dvh relative">
          {children}
        </div>
      </div>
    </>
  );
}
