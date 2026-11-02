"use client";
import { useState, useTransition, useRef, useLayoutEffect } from "react";
import { rememberSpace } from "@/lib/actions/spaces";
import { useFinancialRouter } from "./navigation";
import SpaceForm from "./SpaceForm";
import type { FinancialSpace } from "@/lib/spaces/types";

export function OpenSpaceButton({
  space,
  children,
}: {
  space: FinancialSpace | { id: string };
  children: React.ReactNode;
}) {
  const router = useFinancialRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const mounted = useRef(true);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return (
    <>
      <button
        className="space-btn"
        disabled={pending}
        onClick={() =>
          start(async () => {
            try {
              const result = await rememberSpace(space.id);
              if (!mounted.current) return;
              if (result.ok) router.push(`/espaces/${space.id}`);
              else setError(result.error);
            } catch {
              if (mounted.current)
                setError("Impossible d’ouvrir cet espace. Réessaie.");
            }
          })
        }
      >
        {pending ? "Ouverture…" : children}
      </button>
      {error && (
        <p className="space-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
export function FirstSpace({ actorKey }: { actorKey: string }) {
  const router = useFinancialRouter();
  return (
    <div className="space-onboarding">
      <main className="space-onboarding-inner">
        <p className="space-eyebrow">BIENVENUE DANS MES FINANCES</p>
        <h1>Ton premier espace.</h1>
        <SpaceForm
          actorKey={actorKey}
          context="first-space"
          first
          onCreated={(space) => router.push(`/espaces/${space.id}?guide=open`)}
        />
      </main>
    </div>
  );
}
export function ChooseSpace({ spaces }: { spaces: FinancialSpace[] }) {
  return (
    <div className="space-onboarding">
      <main className="space-onboarding-inner">
        <p className="space-eyebrow">TES FINANCES</p>
        <h1>Choisis ton espace.</h1>
        <p className="space-copy">Chaque espace garde ses finances séparées.</p>
        <div className="space-list">
          {spaces.map((space) => (
            <section className="space-card" key={space.id}>
              <h2>{space.name}</h2>
              <p className="space-hint">
                {space.memberCount} membre{space.memberCount > 1 ? "s" : ""}
              </p>
              <OpenSpaceButton space={space}>Ouvrir cet espace</OpenSpaceButton>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
