"use client";
import { useState, useRef, useEffect, useId } from "react";
import { useFinancialSpace } from "./SpaceContext";
import { useFinancialRouter } from "./navigation";
import SpaceForm from "./SpaceForm";
import SheetCloseButton from "@/components/SheetCloseButton";
import type { FinancialSpace } from "@/lib/spaces/types";

export default function SpacesList({
  spaces,
  actorKey,
  pendingInvites,
}: {
  spaces: FinancialSpace[];
  actorKey: string;
  pendingInvites: number;
}) {
  const { spaceId } = useFinancialSpace();
  const router = useFinancialRouter();
  const [creating, setCreating] = useState(false);
  const sheet = useRef<HTMLElement>(null);
  const title = useId();
  useEffect(() => {
    if (!creating) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheet.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [creating]);
  return (
    <div className="space-page">
      <button className="space-back" onClick={() => router.push("/parametres")}>
        ‹ Réglages
      </button>
      <p className="space-eyebrow">ESPACES ET MEMBRES</p>
      <h1>Tes espaces financiers.</h1>
      <p className="space-copy">
        Retrouve tes espaces et les personnes avec qui tu les partages.
      </p>
      <div className="space-list">
        {spaces.map((space) => (
          <button
            key={space.id}
            className="space-settings-row"
            onClick={() => router.push(`/parametres/espace/${space.id}`)}
          >
            <span className="space-mini-icon" aria-hidden="true">
              ▱
            </span>
            <span>
              <strong>{space.name}</strong>
              <small>
                {space.memberCount} membre{space.memberCount > 1 ? "s" : ""}
                {space.id === spaceId ? " · Espace actif" : ""}
              </small>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        ))}
      </div>
      <button
        className="space-btn"
        style={{ marginTop: 20 }}
        onClick={() => setCreating(true)}
      >
        Créer un espace
      </button>
      {pendingInvites > 0 && (
        <button
          className="space-settings-row"
          style={{ marginTop: 20 }}
          onClick={() => router.push("/invitations")}
        >
          <span aria-hidden="true">✉</span>
          <span>
            <strong>Invitations reçues</strong>
            <small>{pendingInvites} en attente</small>
          </span>
          <span aria-hidden="true">›</span>
        </button>
      )}
      {creating && (
        <div
          className="sheet-backdrop"
          style={{ zIndex: 160 }}
          onClick={(event) => {
            if (event.target === event.currentTarget) setCreating(false);
          }}
        >
          <section
            ref={sheet}
            tabIndex={-1}
            className="sheet space-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title}
            onKeyDown={(event) => {
              if (event.key === "Escape") setCreating(false);
              if (event.key === "Tab") {
                const controls = sheet.current?.querySelectorAll<HTMLElement>(
                  "button:not(:disabled),input:not(:disabled)",
                );
                if (!controls?.length) return;
                const first = controls[0],
                  last = controls[controls.length - 1];
                if (
                  event.shiftKey &&
                  (document.activeElement === first ||
                    document.activeElement === sheet.current)
                ) {
                  event.preventDefault();
                  last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <div className="sheet-handle" />
            <SheetCloseButton onClose={() => setCreating(false)} />
            <h2 id={title}>Créer un espace</h2>
            <SpaceForm
              actorKey={actorKey}
              context={`settings:${spaceId}`}
              onCancel={() => setCreating(false)}
              onCreated={(space) => {
                setCreating(false);
                router.push(`/espaces/${space.id}`);
              }}
            />
          </section>
        </div>
      )}
    </div>
  );
}
