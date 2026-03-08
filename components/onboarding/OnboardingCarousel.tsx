"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
  onComplete: () => void;
  onSkip: () => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_SLIDES = 4;

// Slides 0 and 3 (first and last) use dark nav (teal background)
const DARK_NAV_SLIDES = new Set([0, 3]);

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingCarousel({ onComplete, onSkip }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  // Track which slides have been activated (for entrance animations)
  const [activatedSlides, setActivatedSlides] = useState<Set<number>>(
    new Set([0]),
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const isDark = DARK_NAV_SLIDES.has(currentSlide);

  // ─── Navigation ──────────────────────────────────────────────────────────

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= TOTAL_SLIDES) return;
    setCurrentSlide(index);
    setActivatedSlides((prev) => new Set([...prev, index]));
    setDragOffset(0);
  }, []);

  const goNext = useCallback(
    () => goTo(currentSlide + 1),
    [currentSlide, goTo],
  );
  const goPrev = useCallback(
    () => goTo(currentSlide - 1),
    [currentSlide, goTo],
  );

  // ─── Keyboard navigation ─────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  // ─── Touch / swipe ───────────────────────────────────────────────────────

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    currentXRef.current = e.touches[0].clientX;
    const diff = currentXRef.current - startXRef.current;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const diff = currentXRef.current - startXRef.current;
    const threshold = (viewportRef.current?.offsetWidth ?? 375) * 0.2;

    if (diff < -threshold && currentSlide < TOTAL_SLIDES - 1) {
      goTo(currentSlide + 1);
    } else if (diff > threshold && currentSlide > 0) {
      goTo(currentSlide - 1);
    } else {
      setDragOffset(0);
    }

    startXRef.current = 0;
    currentXRef.current = 0;
  };

  // ─── Track transform ─────────────────────────────────────────────────────

  const trackTranslate =
    -(currentSlide * 100) +
    (dragOffset / (viewportRef.current?.offsetWidth ?? 375)) * 100;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      className="onboarding-carousel"
      role="region"
      aria-label="Presentation de Mes Finances"
      aria-roledescription="carousel"
    >
      {/* ── Carousel viewport ── */}
      <div
        ref={viewportRef}
        className="onboarding-viewport"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`onboarding-track${isDragging ? " onboarding-track--dragging" : ""}`}
          style={{ transform: `translateX(${trackTranslate}%)` }}
        >
          {/* ── Slide 1: Bienvenue ── */}
          <SlideWelcome
            isActive={activatedSlides.has(0)}
            slideIndex={0}
            currentSlide={currentSlide}
          />

          {/* ── Slide 2: Depenses ── */}
          <SlideDepenses
            isActive={activatedSlides.has(1)}
            slideIndex={1}
            currentSlide={currentSlide}
          />

          {/* ── Slide 3: Patrimoine ── */}
          <SlidePatrimoine
            isActive={activatedSlides.has(2)}
            slideIndex={2}
            currentSlide={currentSlide}
          />

          {/* ── Slide 4: C'est parti ── */}
          <SlideGo
            isActive={activatedSlides.has(3)}
            slideIndex={3}
            currentSlide={currentSlide}
            onComplete={onComplete}
          />
        </div>
      </div>

      {/* ── Navigation bar ── */}
      <nav
        className={`onboarding-nav${isDark ? " onboarding-nav--dark" : ""}`}
        aria-label="Navigation du carousel"
      >
        {/* Skip button */}
        <button
          className="onboarding-btn-skip"
          onClick={onSkip}
          aria-label="Passer la presentation"
        >
          Passer
        </button>

        {/* Dot indicators */}
        <div className="onboarding-dots" role="tablist" aria-label="Slides">
          {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
            <button
              key={i}
              className={`onboarding-dot${currentSlide === i ? " onboarding-dot--active" : ""}`}
              role="tab"
              aria-selected={currentSlide === i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        {/* Next button — hidden on last slide */}
        <button
          className={`onboarding-btn-next${currentSlide === TOTAL_SLIDES - 1 ? " onboarding-btn-next--hidden" : ""}`}
          onClick={goNext}
          aria-label="Slide suivante"
          tabIndex={currentSlide === TOTAL_SLIDES - 1 ? -1 : 0}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </nav>
    </div>
  );
}

// ─── Slide 1: Bienvenue ───────────────────────────────────────────────────────

function SlideWelcome({
  isActive,
  slideIndex,
  currentSlide,
}: {
  isActive: boolean;
  slideIndex: number;
  currentSlide: number;
}) {
  return (
    <div
      className="onboarding-slide onboarding-slide--welcome"
      role="group"
      aria-roledescription="slide"
      aria-label="Slide 1 sur 4: Bienvenue"
      aria-hidden={currentSlide !== slideIndex}
    >
      <p className="onboarding-slide-label">Mes Finances</p>
      <h1 className="onboarding-headline-welcome">
        <span
          className={`onboarding-word onboarding-word--1${isActive ? " onboarding-word--visible" : ""}`}
        >
          Prends
        </span>{" "}
        <span
          className={`onboarding-word onboarding-word--2${isActive ? " onboarding-word--visible" : ""}`}
        >
          le
        </span>{" "}
        <span
          className={`onboarding-word onboarding-word--3${isActive ? " onboarding-word--visible" : ""}`}
        >
          controle
        </span>
        <span className="onboarding-line-break" />
        <span
          className={`onboarding-word onboarding-word--4${isActive ? " onboarding-word--visible" : ""}`}
        >
          de
        </span>{" "}
        <span
          className={`onboarding-word onboarding-word--5${isActive ? " onboarding-word--visible" : ""}`}
        >
          tes&nbsp;finances.
        </span>
      </h1>
      <p
        className={`onboarding-subtitle-welcome${isActive ? " onboarding-subtitle-welcome--visible" : ""}`}
      >
        Tout ce dont tu as besoin pour voir clair dans ton budget. Simplement.
      </p>
    </div>
  );
}

// ─── Slide 2: Depenses ────────────────────────────────────────────────────────

const FEATURE_BLOCKS = [
  {
    name: "Revenus recurrents",
    desc: "Salaire, pigiste, allocations — avec leur frequence.",
  },
  {
    name: "Charges fixes",
    desc: "Loyer, abonnements, assurances. Mensuelles, trimestrielles ou annuelles.",
  },
  {
    name: "Generation automatique",
    desc: "Tes depenses du mois se creent toutes seules a partir de tes modeles.",
  },
  {
    name: "Depenses imprevues",
    desc: "Ajoute ce qui sort du cadre en quelques secondes.",
  },
];

function SlideDepenses({
  isActive,
  slideIndex,
  currentSlide,
}: {
  isActive: boolean;
  slideIndex: number;
  currentSlide: number;
}) {
  return (
    <div
      className="onboarding-slide onboarding-slide--depenses"
      role="group"
      aria-roledescription="slide"
      aria-label="Slide 2 sur 4: Suivi des depenses"
      aria-hidden={currentSlide !== slideIndex}
    >
      <div className="onboarding-slide-header">
        <p className="onboarding-eyebrow">Depenses</p>
        <h2 className="onboarding-slide-title">
          Suis chaque dollar, sans effort.
        </h2>
      </div>
      <div className="onboarding-feature-stack">
        {FEATURE_BLOCKS.map((block, i) => (
          <div
            key={block.name}
            className={`onboarding-feature-block onboarding-feature-block--${i + 1}${isActive ? " onboarding-feature-block--visible" : ""}`}
          >
            <p className="onboarding-feature-name">{block.name}</p>
            <p className="onboarding-feature-desc">{block.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Slide 3: Patrimoine ─────────────────────────────────────────────────────

const PATRIMOINE_BLOCKS = [
  {
    name: "Objectifs d'épargne",
    desc: "Definis un objectif, vois ta progression en temps reel.",
  },
  {
    name: "Epargne libre",
    desc: "Pas d'objectif précis? Mets de côté quand même.",
  },
  {
    name: "Suivi des dettes",
    desc: "Paiements automatiques, solde restant, date de liberation.",
  },
];

function SlidePatrimoine({
  isActive,
  slideIndex,
  currentSlide,
}: {
  isActive: boolean;
  slideIndex: number;
  currentSlide: number;
}) {
  return (
    <div
      className="onboarding-slide onboarding-slide--patrimoine"
      role="group"
      aria-roledescription="slide"
      aria-label="Slide 3 sur 4: Patrimoine"
      aria-hidden={currentSlide !== slideIndex}
    >
      <div className="onboarding-slide-header">
        <p className="onboarding-eyebrow">Patrimoine</p>
        <h2 className="onboarding-slide-title">
          Construis, rembourse, progresse.
        </h2>
      </div>
      <div className="onboarding-patrimoine-grid">
        {PATRIMOINE_BLOCKS.map((block, i) => (
          <div
            key={block.name}
            className={`onboarding-patrimoine-block onboarding-patrimoine-block--${i + 1}${isActive ? " onboarding-patrimoine-block--visible" : ""}`}
          >
            <p className="onboarding-feature-name">{block.name}</p>
            <p className="onboarding-feature-desc">{block.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Slide 4: C'est parti ────────────────────────────────────────────────────

function SlideGo({
  isActive,
  slideIndex,
  currentSlide,
  onComplete,
}: {
  isActive: boolean;
  slideIndex: number;
  currentSlide: number;
  onComplete: () => void;
}) {
  return (
    <div
      className="onboarding-slide onboarding-slide--go"
      role="group"
      aria-roledescription="slide"
      aria-label="Slide 4 sur 4: C'est parti"
      aria-hidden={currentSlide !== slideIndex}
    >
      <div className="onboarding-slide-number" aria-hidden="true">
        4
      </div>
      <h2 className="onboarding-go-headline">C&apos;est parti.</h2>
      <p
        className={`onboarding-go-subtitle${isActive ? " onboarding-go-subtitle--visible" : ""}`}
      >
        Ton tableau de bord t&apos;attend. Le guide de configuration va
        t&apos;accompagner pas a pas.
      </p>
      <button
        className={`onboarding-btn-go${isActive ? " onboarding-btn-go--visible" : ""}`}
        onClick={onComplete}
        aria-label="Acceder au tableau de bord"
      >
        C&apos;est parti !
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
