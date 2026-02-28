import type { Metadata } from 'next';
import Link from 'next/link';
import ScrollReveal from '@/components/landing/ScrollReveal';

export const metadata: Metadata = {
  title: 'Mes Finances — Toute ta vie financiere, claire et sous controle',
  description:
    'Depenses, revenus, patrimoine, score de sante — tout dans une app gratuite, simple et privee. Cree ton compte en 30 secondes.',
};

/* ── SVG Icons (reused from BottomNav) ─────────────────── */
const IconExpenses = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="3" />
    <path d="M2 10h20" />
    <path d="M6 15h4" strokeWidth="2" />
  </svg>
);

const IconRevenue = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconPatrimoine = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const IconHealth = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

/* ── Logo component ────────────────────────────────────── */
function Logo({ size = 32 }: { size?: number }) {
  const svgSize = size * 0.5;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size <= 28 ? 'var(--radius-sm)' : 'var(--radius-md)',
        background: 'var(--accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width={svgSize} height={svgSize} viewBox="0 0 56 56" fill="none">
        <path d="M8 44 L18 14 L28 34 L38 8 L48 44" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ── Phone Mockup component ────────────────────────────── */
function PhoneMockup({
  src,
  alt,
  priority = false,
  small = false,
  animated = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  small?: boolean;
  animated?: boolean;
}) {
  return (
    <div className={`${small ? 'phone-mockup-sm' : 'phone-mockup'} ${animated ? 'phone-mockup-animated' : ''}`}>
      <div className="phone-mockup-screen">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={small ? 180 : 260}
          height={small ? 370 : 530}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="landing-page" style={{ minHeight: '100dvh', overflowX: 'hidden' }}>

      {/* ── 1. HEADER ──────────────────────────────────────── */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          zIndex: 50,
          background: 'rgba(245, 244, 241, 0.82)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(229, 227, 223, 0.6)',
        }}
      >
        <div
          style={{
            maxWidth: '1120px',
            margin: '0 auto',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
          }}
        >
          {/* Left: logo + brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Logo size={28} />
            <span
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: 'var(--tracking-tight)',
              }}
            >
              Mes Finances
            </span>
          </div>

          {/* Right: nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              href="/auth/sign-in"
              className="hidden md:inline-flex"
              style={{
                padding: '8px 16px',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                borderRadius: 'var(--radius-full)',
                transition: 'color var(--duration-fast) var(--ease-out)',
              }}
            >
              Connexion
            </Link>
            <Link
              href="/auth/sign-up"
              style={{
                padding: '8px 20px',
                fontSize: 'var(--text-xs)',
                fontWeight: 650,
                color: 'white',
                background: 'var(--accent)',
                borderRadius: 'var(--radius-full)',
                textDecoration: 'none',
                transition: 'opacity var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-spring)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <span className="hidden md:inline">Commencer gratuitement</span>
              <span className="md:hidden">Commencer</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. HERO ────────────────────────────────────────── */}
      <section
        style={{
          minHeight: '90vh',
          paddingTop: '96px',
          paddingBottom: '64px',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--surface-ground)',
        }}
      >
        <div
          style={{
            maxWidth: '1120px',
            margin: '0 auto',
            padding: '0 20px',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '48px',
            alignItems: 'center',
          }}
          className="landing-hero-grid"
        >
          {/* Text column */}
          <div className="landing-hero-stagger" style={{ maxWidth: '540px' }}>
            <h1
              style={{
                fontSize: 'clamp(var(--text-2xl), 5vw, var(--text-3xl))',
                fontWeight: 750,
                color: 'var(--text-primary)',
                letterSpacing: 'var(--tracking-tight)',
                lineHeight: 'var(--leading-tight)',
              }}
            >
              Toute ta vie financiere,{' '}
              <span style={{ color: 'var(--accent)' }}>claire et sous controle.</span>
            </h1>

            <p
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-normal)',
                marginTop: '16px',
                maxWidth: '460px',
              }}
            >
              Depenses, revenus, patrimoine, score de sante — tout dans une app gratuite, simple et privee.
            </p>

            <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
              <Link
                href="/auth/sign-up"
                className="landing-cta-glow"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '14px 32px',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 650,
                  color: 'white',
                  background: 'var(--accent)',
                  borderRadius: 'var(--radius-full)',
                  textDecoration: 'none',
                  boxShadow: 'var(--shadow-accent)',
                  transition: 'transform var(--duration-fast) var(--ease-spring)',
                }}
              >
                Creer mon compte gratuit
              </Link>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                Gratuit pour toujours. Aucune carte requise.
              </span>
            </div>
          </div>

          {/* Phone mockup column */}
          <div
            className="landing-phone-enter"
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <PhoneMockup
              src="/landing/landing-dashboard.png"
              alt="Dashboard Mes Finances"
              priority
              animated
            />
          </div>
        </div>
      </section>

      {/* ── 3. FEATURES ────────────────────────────────────── */}
      <section
        style={{
          background: 'var(--surface-raised)',
          padding: '80px 20px',
        }}
      >
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 650,
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-widest)',
                }}
              >
                Fonctionnalites
              </span>
              <h2
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 750,
                  color: 'var(--text-primary)',
                  letterSpacing: 'var(--tracking-tight)',
                  lineHeight: 'var(--leading-tight)',
                  marginTop: '8px',
                }}
              >
                Tout ce dont tu as besoin
              </h2>
            </div>
          </ScrollReveal>

          {/* Feature cards grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {[
              {
                icon: <IconExpenses />,
                title: 'Suivi des depenses',
                desc: 'Toutes tes depenses, toujours a jour. Charges fixes, variables, ponctuelles — tout est organise.',
                screenshot: '/landing/landing-depenses.png',
                alt: 'Page depenses',
              },
              {
                icon: <IconRevenue />,
                title: 'Revenus et solde',
                desc: 'Revenus attendus vs recus. Tu sais exactement ou tu en es a chaque instant.',
                screenshot: '/landing/landing-dashboard.png',
                alt: 'Dashboard revenus',
              },
              {
                icon: <IconPatrimoine />,
                title: 'Patrimoine net',
                desc: 'Epargne, dettes, valeur nette. Une vision globale de ta situation financiere.',
                screenshot: '/landing/landing-patrimoine.png',
                alt: 'Page patrimoine',
              },
              {
                icon: <IconHealth />,
                title: 'Sante financiere',
                desc: 'Un score pour ta sante financiere. Comprends tes forces et tes axes d\'amelioration.',
                screenshot: '/landing/landing-sante.png',
                alt: 'Onglet sante financiere',
              },
            ].map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i * 100}>
                <div
                  className="landing-feature-card"
                  style={{
                    background: 'var(--surface-ground)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    height: '100%',
                  }}
                >
                  {/* Icon + text */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--accent-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {feature.icon}
                    </div>
                    <h3
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        letterSpacing: 'var(--tracking-tight)',
                      }}
                    >
                      {feature.title}
                    </h3>
                  </div>

                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                      lineHeight: 'var(--leading-normal)',
                    }}
                  >
                    {feature.desc}
                  </p>

                  {/* Mini phone screenshot */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto', paddingTop: '8px' }}>
                    <PhoneMockup
                      src={feature.screenshot}
                      alt={feature.alt}
                      small
                    />
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. COMMENT CA MARCHE ───────────────────────────── */}
      <section style={{ background: 'var(--surface-ground)', padding: '80px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 650,
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-widest)',
                }}
              >
                Comment ca marche
              </span>
              <h2
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 750,
                  color: 'var(--text-primary)',
                  letterSpacing: 'var(--tracking-tight)',
                  lineHeight: 'var(--leading-tight)',
                  marginTop: '8px',
                }}
              >
                Simple comme 1, 2, 3
              </h2>
            </div>
          </ScrollReveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {[
              {
                num: '1',
                title: 'Cree ton compte',
                desc: 'Gratuit, en 30 secondes. Email et mot de passe, c\'est tout.',
              },
              {
                num: '2',
                title: 'Configure tes charges',
                desc: 'Ajoute tes depenses recurrentes, revenus et objectifs d\'epargne.',
              },
              {
                num: '3',
                title: 'Reste en controle',
                desc: 'Chaque mois, tout se genere automatiquement. Tu n\'as qu\'a suivre.',
              },
            ].map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 120}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '20px',
                    background: 'var(--surface-raised)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '24px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {/* Number badge */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--accent)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--text-lg)',
                      fontWeight: 750,
                      flexShrink: 0,
                    }}
                  >
                    {step.num}
                  </div>

                  <div>
                    <h3
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        letterSpacing: 'var(--tracking-tight)',
                      }}
                    >
                      {step.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-secondary)',
                        lineHeight: 'var(--leading-normal)',
                        marginTop: '4px',
                      }}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. TRUST / CONFIANCE ───────────────────────────── */}
      <section style={{ background: 'var(--surface-raised)', padding: '64px 20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <ScrollReveal>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
              }}
            >
              {[
                {
                  emoji: '💰',
                  title: '100% Gratuit',
                  desc: 'Pas de plan premium, pas de piege. Toutes les fonctionnalites, pour toujours.',
                  bg: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                },
                {
                  emoji: '🔒',
                  title: 'Vie privee',
                  desc: 'Tes donnees restent les tiennes. Aucune revente, aucun tracking publicitaire.',
                  bg: 'var(--positive-subtle)',
                  color: 'var(--positive-text)',
                },
                {
                  emoji: '📱',
                  title: 'PWA installable',
                  desc: 'Installe l\'app sur ton telephone. Fonctionne comme une app native, sans app store.',
                  bg: 'var(--warning-subtle)',
                  color: 'var(--warning-text)',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    background: item.bg,
                    borderRadius: 'var(--radius-xl)',
                    padding: '24px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{item.emoji}</div>
                  <h3
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 700,
                      color: item.color,
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                      lineHeight: 'var(--leading-normal)',
                      marginTop: '8px',
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 6. CTA FINAL ───────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(145deg, #3D3BF3, #3230D4, #2826B0)',
          padding: '80px 20px',
          textAlign: 'center',
        }}
      >
        <ScrollReveal>
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <h2
              style={{
                fontSize: 'clamp(var(--text-xl), 4vw, var(--text-2xl))',
                fontWeight: 750,
                color: 'white',
                letterSpacing: 'var(--tracking-tight)',
                lineHeight: 'var(--leading-tight)',
              }}
            >
              Prends le controle de tes finances des aujourd&apos;hui.
            </h2>

            <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <Link
                href="/auth/sign-up"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '14px 32px',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 650,
                  color: 'var(--accent)',
                  background: 'white',
                  borderRadius: 'var(--radius-full)',
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                  transition: 'transform var(--duration-fast) var(--ease-spring)',
                }}
              >
                Creer mon compte gratuit
              </Link>
              <span style={{ fontSize: 'var(--text-xs)', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>
                Gratuit pour toujours. Sans carte bancaire.
              </span>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── 7. FOOTER ──────────────────────────────────────── */}
      <footer
        style={{
          background: 'var(--surface-ground)',
          padding: '32px 20px',
          borderTop: '1px solid var(--border-default)',
        }}
      >
        <div
          style={{
            maxWidth: '1120px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Logo size={24} />
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                fontWeight: 500,
              }}
            >
              &copy; 2026 Mes Finances
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link
              href="/auth/sign-in"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Connexion
            </Link>
            <Link
              href="/auth/sign-up"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Inscription
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
