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
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 750,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}>
          Mon Budget
        </h1>
      </div>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <AuthView pathname={`/auth/${path}`} />
      </div>
    </main>
  );
}
