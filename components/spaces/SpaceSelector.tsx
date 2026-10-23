"use client";

import {
  useId,
  useState,
  useTransition,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import { useRouter } from "next/navigation";
import { rememberSpace } from "@/lib/actions/spaces";
import { useFinancialSpace } from "./SpaceContext";

export default function SpaceSelector() {
  const { spaceId, spaces, lifetime, hasUnsavedChanges } = useFinancialSpace();
  const id = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const mounted = useRef(true);
  const requestId = useRef(0);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return (
    <div className="space-selector">
      <label htmlFor={id}>ESPACE FINANCIER</label>
      <select
        id={id}
        aria-label="Espace financier actif"
        value={spaceId}
        disabled={pending || spaces.length <= 1}
        onChange={(event) => {
          const target = event.target.value;
          if (
            hasUnsavedChanges() &&
            !window.confirm(
              "Une saisie n’est pas enregistrée. L’abandonner et changer d’espace ?",
            )
          )
            return;
          const request = ++requestId.current;
          lifetime.leave();
          setError("");
          startTransition(async () => {
            try {
              const result = await rememberSpace(target);
              if (!mounted.current || request !== requestId.current) return;
              if (!result.ok) {
                lifetime.stay();
                setError(result.error);
                return;
              }
              router.push(`/espaces/${target}`);
            } catch {
              if (!mounted.current || request !== requestId.current) return;
              lifetime.stay();
              setError("Impossible de changer d’espace. Réessaie.");
            }
          });
        }}
      >
        {spaces.map((space) => (
          <option key={space.id} value={space.id}>
            {space.name}
          </option>
        ))}
      </select>
      {error && (
        <p className="space-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function MobileSpaceSwitcher() {
  const { space } = useFinancialSpace();
  const [open, setOpen] = useState(false);
  const drawer = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);
  return (
    <>
      <div className="space-mobile-bar">
        <button
          type="button"
          aria-label="Changer d’espace financier"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <span aria-hidden="true">☰</span>
          <span>{space.name}</span>
          <span aria-hidden="true">⌄</span>
        </button>
      </div>
      {open && (
        <div
          className="space-drawer-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            className="space-drawer"
            ref={drawer}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Espace financier"
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
              if (event.key === "Tab") {
                const controls = drawer.current?.querySelectorAll<HTMLElement>(
                  "button:not(:disabled),select:not(:disabled)",
                );
                if (!controls?.length) return;
                const first = controls[0],
                  last = controls[controls.length - 1];
                if (
                  event.shiftKey &&
                  (document.activeElement === first ||
                    document.activeElement === drawer.current)
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
            <div className="space-drawer-heading">
              <strong>Mes Finances</strong>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <SpaceSelector />
          </section>
        </div>
      )}
    </>
  );
}
