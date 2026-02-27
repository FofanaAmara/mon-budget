import { AccountView } from '@neondatabase/auth/react';
import Breadcrumb from '@/components/Breadcrumb';
import SignOutButton from '@/components/SignOutButton';

export default async function AccountPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <div style={{ padding: '36px 20px 96px', minHeight: '100vh' }}>
      <Breadcrumb items={[
        { label: 'Reglages', href: '/parametres' },
        { label: 'Mon compte' },
      ]} />
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 750,
          color: 'var(--text-primary)',
          letterSpacing: 'var(--tracking-tight)',
          lineHeight: 'var(--leading-tight)',
        }}>
          Mon compte
        </h1>
      </div>
      <AccountView pathname={`/account/${path}`} />
      <SignOutButton />
    </div>
  );
}
