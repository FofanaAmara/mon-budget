import Link from 'next/link';
import { AuthView } from '@neondatabase/auth/react';
import type { AuthLocalization } from '@neondatabase/auth/react';

const frLocalization: Partial<AuthLocalization> = {
  SIGN_IN: 'Connexion',
  SIGN_IN_ACTION: 'Se connecter',
  SIGN_IN_DESCRIPTION: 'Entrez votre email pour acceder a votre compte',
  SIGN_IN_WITH: 'Se connecter avec',
  SIGN_UP: 'Inscription',
  SIGN_UP_ACTION: 'Creer un compte',
  SIGN_UP_DESCRIPTION: 'Entrez vos informations pour creer un compte',
  SIGN_UP_EMAIL: 'Consultez vos emails pour le lien de verification.',
  SIGN_OUT: 'Deconnexion',
  EMAIL: 'Email',
  EMAIL_PLACEHOLDER: 'votre@email.com',
  EMAIL_REQUIRED: "L'adresse email est requise",
  PASSWORD: 'Mot de passe',
  PASSWORD_REQUIRED: 'Le mot de passe est requis',
  PASSWORD_TOO_SHORT: 'Mot de passe trop court',
  PASSWORD_TOO_LONG: 'Mot de passe trop long',
  CONFIRM_PASSWORD: 'Confirmer le mot de passe',
  CONFIRM_PASSWORD_PLACEHOLDER: 'Confirmer le mot de passe',
  CONFIRM_PASSWORD_REQUIRED: 'La confirmation du mot de passe est requise',
  PASSWORDS_DO_NOT_MATCH: 'Les mots de passe ne correspondent pas',
  NAME: 'Nom',
  NAME_PLACEHOLDER: 'Nom complet',
  FORGOT_PASSWORD: 'Mot de passe oublie',
  FORGOT_PASSWORD_LINK: 'Mot de passe oublie ?',
  FORGOT_PASSWORD_ACTION: 'Envoyer le lien',
  FORGOT_PASSWORD_DESCRIPTION: 'Entrez votre email pour reinitialiser votre mot de passe',
  FORGOT_PASSWORD_EMAIL: 'Consultez vos emails pour le lien de reinitialisation.',
  RESET_PASSWORD: 'Reinitialiser le mot de passe',
  RESET_PASSWORD_ACTION: 'Enregistrer le nouveau mot de passe',
  RESET_PASSWORD_DESCRIPTION: 'Entrez votre nouveau mot de passe ci-dessous',
  RESET_PASSWORD_SUCCESS: 'Mot de passe reinitialise avec succes',
  DONT_HAVE_AN_ACCOUNT: "Vous n'avez pas de compte ?",
  ALREADY_HAVE_AN_ACCOUNT: 'Vous avez deja un compte ?',
  OR_CONTINUE_WITH: 'Ou continuer avec',
  CONTINUE: 'Continuer',
  CANCEL: 'Annuler',
  PASSWORD_PLACEHOLDER: 'Mot de passe',
  NEW_PASSWORD_PLACEHOLDER: 'Nouveau mot de passe',
  CURRENT_PASSWORD_PLACEHOLDER: 'Mot de passe actuel',
  GO_BACK: 'Retour',
};

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  const isSignIn = path === 'sign-in';


  return (
    <>
      {/* Scoped styles for pseudo-elements (grid texture + radial glow) and responsive layout */}
      <style>{`
        .auth-layout {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
        }

        .auth-brand-panel {
          background: var(--accent);
          padding: 32px 24px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .auth-brand-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 80% at 30% 100%, rgba(245, 158, 11, 0.08), transparent),
            radial-gradient(ellipse 50% 50% at 70% 0%, rgba(255, 255, 255, 0.04), transparent);
          pointer-events: none;
        }

        .auth-brand-panel::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .auth-brand-desktop-only {
          display: none;
        }

        .auth-brand-tagline-mobile {
          display: block;
        }

        .auth-form-panel {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 32px 20px 48px;
          background: var(--surface-ground);
        }

        .auth-form-card {
          width: 100%;
          max-width: 420px;
          animation: authFadeSlideUp 0.6s ease both;
        }

        @keyframes authFadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        @media (min-width: 1024px) {
          .auth-layout {
            flex-direction: row;
          }

          .auth-brand-panel {
            width: 50%;
            max-width: 640px;
            padding: 60px 56px;
            align-items: flex-start;
            text-align: left;
            justify-content: center;
            position: sticky;
            top: 0;
            height: 100vh;
            height: 100dvh;
          }

          .auth-brand-desktop-only {
            display: flex;
          }

          .auth-brand-tagline-mobile {
            display: none;
          }

          .auth-form-panel {
            flex: 1;
            align-items: center;
            padding: 48px 56px;
          }

          .auth-form-card {
            max-width: 400px;
          }
        }

        @media (min-width: 1280px) {
          .auth-brand-panel {
            padding: 72px 72px;
          }

          .auth-form-panel {
            padding: 48px 72px;
          }
        }
      `}</style>

      <div className="auth-layout">

        {/* ====== BRAND PANEL ====== */}
        <div className="auth-brand-panel">

          {/* Logo + wordmark — shown on all breakpoints */}
          <Link
            href="/landing"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
              textDecoration: 'none',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <svg width="40" height="40" viewBox="-50 -50 100 100" fill="none">
              <rect x="-36" y="-36" width="72" height="72" rx="18" fill="rgba(255,255,255,0.12)" />
              <path
                d="M-18 22 C-10 18, -4 8, 0 0 S10 -8, 14 -4 S22 -14, 24 -22"
                stroke="#FAFBFC"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="24" cy="-22" r="3.5" fill="#F59E0B" />
            </svg>
            <span style={{ fontSize: '20px', letterSpacing: '-0.02em', lineHeight: 1 }}>
              <strong style={{ fontWeight: 800, color: '#FFFFFF' }}>Mes</strong>
              <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}> Finances</span>
            </span>
          </Link>

          {/* Tagline — mobile only */}
          <p
            className="auth-brand-tagline-mobile"
            style={{
              fontSize: '16px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '-0.01em',
              position: 'relative',
              zIndex: 1,
            }}
          >
            Tes finances. En clair.
          </p>

          {/* Desktop-only content: hero + features + testimonial */}
          <div
            className="auth-brand-desktop-only"
            style={{
              flexDirection: 'column',
              flex: 1,
              width: '100%',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Hero headline */}
            <div style={{ marginTop: '64px' }}>
              <h1
                style={{
                  fontSize: 'clamp(2.5rem, 4vw, 4rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  lineHeight: 0.95,
                  color: '#FFFFFF',
                  marginBottom: '16px',
                }}
              >
                {isSignIn ? (
                  <>Content de<br /><span style={{ color: '#F59E0B' }}>te revoir.</span></>
                ) : (
                  <>Commence<br /><span style={{ color: '#F59E0B' }}>en 2 minutes.</span></>
                )}
              </h1>
              <p
                style={{
                  fontSize: '17px',
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.6,
                  maxWidth: '380px',
                  letterSpacing: '-0.01em',
                }}
              >
                {isSignIn
                  ? 'Retrouve tes données et continue là où tu t\'étais arrêté.'
                  : 'Commence à suivre tes finances en 2 minutes. C\'est gratuit, pour toujours.'}
              </p>
            </div>

            {/* Feature bullets */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                marginTop: '48px',
              }}
            >
              {[
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ),
                  text: 'Configure ton budget en 2 minutes',
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  ),
                  text: 'Suis tes dépenses en temps réel',
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  ),
                  text: 'Analyse ton épargne chaque mois',
                },
              ].map((feature, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: '#F59E0B',
                    }}
                  >
                    {feature.icon}
                  </div>
                  <p
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.8)',
                      lineHeight: 1.5,
                      letterSpacing: '-0.01em',
                      paddingTop: '8px',
                    }}
                  >
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Testimonial — pinned to bottom */}
            <div style={{ marginTop: 'auto', paddingTop: '48px' }}>
              <p
                style={{
                  fontSize: '15px',
                  fontWeight: 500,
                  fontStyle: 'italic',
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.6,
                  marginBottom: '12px',
                  letterSpacing: '-0.01em',
                }}
              >
                &ldquo;Mes Finances m&apos;a aidé à économiser 3 200 $ en 6 mois. Simple et efficace.&rdquo;
              </p>
              <p
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Marie-Claude T.</strong>
                {' '}— Montréal
              </p>
            </div>
          </div>
        </div>

        {/* ====== FORM PANEL ====== */}
        <div className="auth-form-panel">
          <div className="auth-form-card">

              {/* AuthView — unchanged. It renders its own title + description via frLocalization */}
            <AuthView pathname={`/auth/${path}`} localization={frLocalization} />

            {/* Terms — signup only */}
            {!isSignIn && (
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: 400,
                  color: 'var(--text-tertiary)',
                  lineHeight: 1.6,
                  marginTop: '20px',
                  textAlign: 'center',
                }}
              >
                En créant un compte, tu acceptes nos{' '}
                <a
                  href="#"
                  style={{
                    color: 'var(--accent)',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  Conditions d&apos;utilisation
                </a>{' '}
                et notre{' '}
                <a
                  href="#"
                  style={{
                    color: 'var(--accent)',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  Politique de confidentialité
                </a>
                .
              </p>
            )}

            {/* Back link */}
            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <Link
                href="/landing"
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-tertiary)',
                  textDecoration: 'none',
                }}
              >
                ← Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
