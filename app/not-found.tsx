import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="space-onboarding">
      <section className="space-onboarding-inner">
        <p className="space-eyebrow">MES FINANCES</p>
        <h1>Cette page est indisponible.</h1>
        <p className="space-copy">
          Le lien est incorrect ou ton compte n’a pas accès à cette page.
        </p>
        <Link prefetch={false} href="/espaces" className="space-btn">
          Retrouver mes espaces
        </Link>
      </section>
    </main>
  );
}
