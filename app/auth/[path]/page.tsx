import { AuthView } from '@neondatabase/auth/react';

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      padding: '24px 20px',
      background: 'var(--surface-ground)',
    }}>
      <div style={{ marginBottom: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'var(--accent, #3D3BF3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 56 56" fill="none">
            <path d="M8 44 L18 14 L28 34 L38 8 L48 44" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 750,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}>
          Mes Finances
        </h1>
      </div>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <AuthView pathname={`/auth/${path}`} />
      </div>
    </main>
  );
}
