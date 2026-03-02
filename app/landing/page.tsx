import type { Metadata } from 'next';
import Link from 'next/link';
import ScrollReveal from '@/components/landing/ScrollReveal';

export const metadata: Metadata = {
  title: 'Mes Finances — Tes finances. En clair.',
  description:
    'Sais exactement ou va ton argent. Pas de surprise. Pas de stress. Juste de la clarte. Gratuit pour toujours.',
};

/* ── Le Compas SVG logo (brand spec) ──────────────────── */
function CompassLogo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      fill="none"
      aria-label="Mes Finances logo"
    >
      <rect x="-36" y="-36" width="72" height="72" rx="18" fill="#0F766E" />
      <path
        d="M-18 22 C-10 18, -4 8, 0 0 S10 -8, 14 -4 S22 -14, 24 -22"
        stroke="#FAFBFC"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="24" cy="-22" r="3.5" fill="#F59E0B" />
    </svg>
  );
}

/* ── Arrow icon (CTA buttons) ──────────────────────────── */
function ArrowRight() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ flexShrink: 0 }}
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/* ── Feature card icons (inline SVG, teal) ─────────────── */
function IconDashboard() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}

function IconCategory() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}

function IconTrend() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconFast() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

/* ── Star icon (testimonial rating) ────────────────────── */
function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div
      className="landing-page"
      style={{
        minHeight: '100dvh',
        overflowX: 'hidden',
        background: '#FAFBFC',
        fontFamily: 'var(--font)',
      }}
    >

      {/* ── 1. NAVIGATION ──────────────────────────────────── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(250, 251, 252, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
        }}
      >
        {/* Logo + wordmark */}
        <Link
          href="/landing"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
          }}
        >
          <CompassLogo size={36} />
          <span
            style={{
              fontSize: '18px',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            <span style={{ fontWeight: 800, color: '#0F172A' }}>Mes</span>
            <span style={{ fontWeight: 600, color: '#0F766E' }}> Finances</span>
          </span>
        </Link>

        {/* Nav actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/auth/sign-in"
            style={{
              display: 'none',
              fontSize: '14px',
              fontWeight: 600,
              color: '#334155',
              textDecoration: 'none',
              letterSpacing: '-0.01em',
              transition: 'color 0.2s',
            }}
            className="md:inline"
          >
            Connexion
          </Link>
          <Link
            href="/auth/sign-up"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              background: '#0F766E',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: '12px',
              letterSpacing: '-0.01em',
              transition: 'background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
              boxShadow: '0 2px 8px rgba(15, 118, 110, 0.18)',
            }}
          >
            Commencer
            <ArrowRight />
          </Link>
        </div>
      </nav>

      {/* ── 2. HERO ─────────────────────────────────────────── */}
      <section
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '100px 20px 60px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle teal grid background */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(15, 118, 110, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 118, 110, 0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            background: '#F0FDFA',
            border: '1px solid rgba(15, 118, 110, 0.12)',
            borderRadius: '100px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#0F766E',
            letterSpacing: '0.02em',
            marginBottom: '32px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              background: '#F59E0B',
              borderRadius: '50%',
              flexShrink: 0,
            }}
          />
          100% gratuit. Aucune carte requise.
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 'clamp(3.2rem, 10vw, 9rem)',
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
            color: '#0F172A',
            marginBottom: '8px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          Tes finances.
          <br />
          <span
            style={{
              color: '#0F766E',
              position: 'relative',
              display: 'inline-block',
            }}
          >
            En clair.
            {/* Amber highlight underline */}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                bottom: '0.05em',
                left: '-0.05em',
                right: '-0.05em',
                height: '0.18em',
                background: 'rgba(245, 158, 11, 0.25)',
                borderRadius: '4px',
                zIndex: -1,
              }}
            />
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
            fontWeight: 400,
            color: '#64748B',
            maxWidth: '480px',
            margin: '24px auto 0',
            lineHeight: 1.5,
            letterSpacing: '-0.01em',
            position: 'relative',
            zIndex: 1,
          }}
        >
          Sais exactement ou va ton argent. Pas de surprise. Pas de stress. Juste de la clarte.
        </p>

        {/* Hero figure: 847$ monument */}
        <div
          style={{
            marginTop: '48px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(4rem, 14vw, 10rem)',
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.05em',
              color: '#0F172A',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            847
            <span
              style={{
                fontSize: '0.45em',
                fontWeight: 600,
                color: '#0F766E',
                verticalAlign: 'super',
                marginLeft: '4px',
                letterSpacing: 0,
              }}
            >
              $
            </span>
          </div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#64748B',
              marginTop: '4px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            DISPONIBLE CE MOIS-CI
          </div>
        </div>

        {/* CTA group */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            marginTop: '48px',
            position: 'relative',
            zIndex: 1,
          }}
          className="landing-cta-group"
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
            className="landing-cta-buttons"
          >
            <Link
              href="/auth/sign-up"
              className="btn-amber"
              style={{
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: 700,
                gap: '8px',
                borderRadius: '12px',
                textDecoration: 'none',
              }}
            >
              Commencer gratuitement →
            </Link>
            <Link
              href="/auth/sign-in"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                background: 'transparent',
                color: '#0F766E',
                fontSize: '15px',
                fontWeight: 600,
                textDecoration: 'none',
                borderRadius: '12px',
                border: '1.5px solid #0F766E',
                letterSpacing: '-0.01em',
                transition: 'background 0.2s ease, transform 0.2s ease',
              }}
            >
              Se connecter
            </Link>
          </div>
          <p
            style={{
              fontSize: '13px',
              color: '#64748B',
              fontWeight: 400,
              marginTop: '4px',
            }}
          >
            Inscription en 2 minutes
          </p>
        </div>
      </section>

      {/* ── 3. PROOF BANNER ─────────────────────────────────── */}
      <section
        style={{
          padding: '40px 20px',
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          borderBottom: '1px solid #E2E8F0',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#64748B',
            letterSpacing: '0.04em',
          }}
        >
          Deja utilise par{' '}
          <strong style={{ color: '#F59E0B', fontWeight: 700 }}>2 400+</strong>{' '}
          Quebecois pour gerer leur budget mensuel
        </p>
      </section>

      {/* ── 4. VALUE PROPOSITION ("Les chiffres qui comptent") ─ */}
      <section
        style={{
          padding: '80px 20px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#0F766E',
                  marginBottom: '16px',
                }}
              >
                Pourquoi Mes Finances
              </p>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.05,
                  color: '#0F172A',
                  maxWidth: '600px',
                  margin: '0 auto',
                }}
              >
                Les chiffres qui comptent, rien d&apos;autre
              </h2>
            </div>
          </ScrollReveal>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '48px',
            }}
          >
            {[
              {
                number: '2',
                unit: ' min',
                name: 'Pour commencer',
                desc: 'Configure ton budget en quelques taps. Pas de sync bancaire, pas de complications.',
                amber: false,
              },
              {
                number: '200',
                unit: ' $',
                name: 'Epargne moyenne',
                desc: "Ce que nos utilisateurs economisent de plus chaque mois apres 3 mois d'utilisation.",
                amber: true,
              },
              {
                number: '0',
                unit: ' $',
                name: 'Pour toujours',
                desc: 'Gratuit, sans pub, sans vente de donnees. Ton budget reste le tien.',
                amber: false,
              },
            ].map((item, i) => (
              <ScrollReveal key={item.name} delay={i * 120}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: 'clamp(3rem, 8vw, 5rem)',
                      fontWeight: 800,
                      letterSpacing: '-0.04em',
                      lineHeight: 1,
                      color: item.amber ? '#F59E0B' : '#0F172A',
                      marginBottom: '8px',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {item.number}
                    <span
                      style={{
                        fontSize: '0.5em',
                        fontWeight: 600,
                        color: item.amber ? '#D97706' : '#0F766E',
                        letterSpacing: 0,
                      }}
                    >
                      {item.unit}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#0F172A',
                      letterSpacing: '-0.02em',
                      marginBottom: '8px',
                    }}
                  >
                    {item.name}
                  </div>
                  <p
                    style={{
                      fontSize: '15px',
                      color: '#64748B',
                      lineHeight: 1.6,
                      maxWidth: '340px',
                      margin: '0 auto',
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. HOW IT WORKS ("Trois gestes, c'est tout") ───── */}
      <section
        style={{
          padding: '80px 20px',
          background: '#FFFFFF',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#0F766E',
                  marginBottom: '16px',
                }}
              >
                Comment ca marche
              </p>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.05,
                  color: '#0F172A',
                  maxWidth: '600px',
                  margin: '0 auto',
                }}
              >
                Trois gestes, c&apos;est tout
              </h2>
            </div>
          </ScrollReveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              {
                num: '01',
                title: 'Configure tes revenus',
                desc: (
                  <>
                    Indique combien tu gagnes et{' '}
                    <span style={{ color: '#0F766E', fontWeight: 600 }}>a quelle frequence</span>.
                    {' '}Salaire, pourboires, pige — tout compte.
                  </>
                ),
              },
              {
                num: '02',
                title: 'Note tes depenses',
                desc: (
                  <>
                    Chaque achat prend{' '}
                    <span style={{ color: '#0F766E', fontWeight: 600 }}>5 secondes a entrer</span>.
                    {' '}Montant, categorie, c&apos;est tout. On s&apos;occupe du reste.
                  </>
                ),
              },
              {
                num: '03',
                title: "Vois ou t'en es",
                desc: (
                  <>
                    Ton tableau de bord te dit{' '}
                    <span style={{ color: '#0F766E', fontWeight: 600 }}>combien il te reste</span>,
                    {' '}ce que t&apos;as depense, et si tu es dans les temps.
                  </>
                ),
              },
            ].map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 120}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '24px',
                    padding: '32px 0',
                    borderTop: i > 0 ? '1px solid #F1F5F9' : 'none',
                  }}
                >
                  {/* Large greyed number with amber dot accent */}
                  <div
                    style={{
                      flexShrink: 0,
                      fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                      fontWeight: 800,
                      letterSpacing: '-0.04em',
                      lineHeight: 1,
                      color: '#E2E8F0',
                      width: '64px',
                      textAlign: 'right',
                    }}
                  >
                    {step.num}
                    <span style={{ color: '#F59E0B', fontSize: '0.6em', verticalAlign: 'super' }}>
                      •
                    </span>
                  </div>

                  {/* Step content */}
                  <div style={{ flex: 1, paddingTop: '4px' }}>
                    <h3
                      style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        color: '#0F172A',
                        marginBottom: '8px',
                      }}
                    >
                      {step.title}
                    </h3>
                    <p
                      style={{
                        fontSize: '15px',
                        color: '#64748B',
                        lineHeight: 1.6,
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

      {/* ── 6. FEATURES ("Tout ce qu'il faut, rien de trop") ── */}
      <section
        style={{
          padding: '80px 20px 100px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#0F766E',
                  marginBottom: '16px',
                }}
              >
                Fonctionnalites
              </p>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.05,
                  color: '#0F172A',
                  maxWidth: '600px',
                  margin: '0 auto',
                }}
              >
                Tout ce qu&apos;il faut, rien de trop
              </h2>
            </div>
          </ScrollReveal>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}
            className="landing-feature-grid"
          >
            {[
              {
                icon: <IconDashboard />,
                stat: '847',
                unit: ' $',
                title: 'Solde en direct',
                desc: 'Ton solde disponible, mis a jour a chaque depense. Pas besoin de calculer.',
                amber: false,
              },
              {
                icon: <IconCategory />,
                stat: '12',
                unit: '',
                title: 'Categories',
                desc: "Loyer, epicerie, transport, restos... Chaque dollar a sa place.",
                amber: false,
              },
              {
                icon: <IconTrend />,
                stat: '+14',
                unit: ' %',
                title: 'Suivi mensuel',
                desc: 'Compare tes mois. Celebre tes progres. Identifie ce qui te coute cher.',
                amber: true,
              },
              {
                icon: <IconShield />,
                stat: '100',
                unit: ' %',
                title: 'Prive et securise',
                desc: 'Tes donnees restent sur ton compte. Aucun acces a tes comptes bancaires.',
                amber: false,
              },
              {
                icon: <IconFast />,
                stat: '5',
                unit: ' sec',
                title: 'Entree rapide',
                desc: 'Ajouter une depense prend 5 secondes. Montant, categorie, termine.',
                amber: false,
              },
              {
                icon: <IconClock />,
                stat: '24',
                unit: ' /7',
                title: 'Toujours disponible',
                desc: 'Ton budget accessible sur mobile ou desktop, quand tu en as besoin.',
                amber: false,
              },
            ].map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i * 80}>
                <div
                  className="landing-feature-card"
                  style={{
                    padding: '32px 24px',
                    background: '#FFFFFF',
                    borderRadius: '18px',
                    border: '1px solid #E2E8F0',
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: feature.amber ? 'rgba(245, 158, 11, 0.1)' : '#F0FDFA',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      color: feature.amber ? '#F59E0B' : '#0F766E',
                    }}
                  >
                    {feature.icon}
                  </div>

                  {/* Stat number */}
                  <div
                    style={{
                      fontSize: 'clamp(2rem, 5vw, 2.5rem)',
                      fontWeight: 800,
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                      color: feature.amber ? '#F59E0B' : '#0F766E',
                      marginBottom: '4px',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {feature.stat}
                    {feature.unit && (
                      <span
                        style={{
                          fontSize: '0.5em',
                          fontWeight: 600,
                          color: feature.amber ? '#D97706' : '#0F766E',
                        }}
                      >
                        {feature.unit}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: '17px',
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                      color: '#0F172A',
                      marginBottom: '8px',
                    }}
                  >
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#64748B',
                      lineHeight: 1.6,
                    }}
                  >
                    {feature.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. TESTIMONIAL ──────────────────────────────────── */}
      <section
        style={{
          padding: '80px 20px',
          background: '#0F766E',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative radial gradients */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 50% 80% at 20% 100%, rgba(245, 158, 11, 0.1), transparent), radial-gradient(ellipse 40% 50% at 80% 0%, rgba(255, 255, 255, 0.04), transparent)',
            pointerEvents: 'none',
          }}
        />

        <ScrollReveal>
          {/* Star rating */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '4px',
              marginBottom: '24px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <StarIcon key={i} />
            ))}
          </div>

          {/* Quote */}
          <blockquote
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              color: '#FFFFFF',
              maxWidth: '700px',
              margin: '0 auto 24px',
              position: 'relative',
              zIndex: 1,
              fontStyle: 'italic',
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: '3em',
                lineHeight: 0.5,
                color: '#F59E0B',
                marginBottom: '16px',
                fontWeight: 800,
                fontStyle: 'normal',
              }}
              aria-hidden="true"
            >
              &ldquo;
            </span>
            J&apos;ai jamais su ou allait mon argent avant. Maintenant, je check mon dashboard
            chaque matin avec mon cafe. C&apos;est devenu un reflexe.
          </blockquote>

          {/* Attribution */}
          <p
            style={{
              fontSize: '15px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.6)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <strong style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 700 }}>
              Marie-Eve L.
            </strong>{' '}
            — Montreal
          </p>
        </ScrollReveal>
      </section>

      {/* ── 8. CTA FINAL ("Ton argent, ton rythme.") ────────── */}
      <section
        style={{
          padding: '100px 20px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <ScrollReveal>
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <h2
              style={{
                fontSize: 'clamp(2.5rem, 8vw, 6rem)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 0.95,
                color: '#0F172A',
                marginBottom: '16px',
              }}
            >
              Ton argent,
              <br />
              <span style={{ color: '#0F766E' }}>ton rythme.</span>
            </h2>

            <p
              style={{
                fontSize: '17px',
                fontWeight: 400,
                color: '#64748B',
                marginBottom: '40px',
                letterSpacing: '-0.01em',
              }}
            >
              Commence a suivre tes finances en 2 minutes. C&apos;est gratuit.
            </p>

            <Link
              href="/auth/sign-up"
              className="btn-amber"
              style={{
                padding: '18px 40px',
                fontSize: '17px',
                fontWeight: 700,
                gap: '8px',
                borderRadius: '12px',
                textDecoration: 'none',
              }}
            >
              Creer mon budget →
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* ── 9. FOOTER ───────────────────────────────────────── */}
      <footer
        style={{
          padding: '48px 20px 32px',
          borderTop: '1px solid #E2E8F0',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <CompassLogo size={28} />
          <span style={{ fontSize: '16px', letterSpacing: '-0.02em' }}>
            <span style={{ fontWeight: 800, color: '#0F172A' }}>Mes</span>
            <span style={{ fontWeight: 600, color: '#0F766E' }}> Finances</span>
          </span>
        </div>

        {/* Nav links */}
        <ul
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            listStyle: 'none',
            padding: 0,
            margin: '0 0 24px',
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'Confidentialite', href: '#' },
            { label: 'Conditions', href: '#' },
            { label: 'Support', href: '#' },
            { label: 'Contact', href: '#' },
          ].map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#64748B',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Copyright */}
        <p
          style={{
            fontSize: '12px',
            color: '#CBD5E1',
          }}
        >
          2026 Mes Finances. Fait a Montreal avec soin.
        </p>
      </footer>

      {/* ── Responsive styles via style tag ─────────────────── */}
      <style>{`
        @media (min-width: 640px) {
          .landing-cta-buttons {
            flex-direction: row !important;
            align-items: center !important;
          }
          .landing-feature-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .landing-feature-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        .nav-login-desktop {
          display: none;
        }
        @media (min-width: 768px) {
          .nav-login-desktop {
            display: inline !important;
          }
        }
      `}</style>
    </div>
  );
}
