"use client";

export default function SpaceLoadingError() {
  return (
    <main className="space-onboarding">
      <section className="space-onboarding-inner" aria-labelledby="space-loading-error">
        <p className="space-eyebrow">MES FINANCES</p>
        <h1 id="space-loading-error">Ton espace n’a pas pu être chargé.</h1>
        <p className="space-copy" role="status">
          Le chargement a été interrompu. Réessaie dans un instant.
        </p>
        <button type="button" className="space-btn" onClick={() => window.location.reload()}>Réessayer</button>
      </section>
    </main>
  );
}
