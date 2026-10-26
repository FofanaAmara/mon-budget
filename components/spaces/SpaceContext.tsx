"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
  useId,
  type ReactNode,
  type FormEvent,
} from "react";
import type { FinancialSpace } from "@/lib/spaces/types";
import { createSpaceLifetime } from "@/lib/spaces/navigation-lifetime";

type Value = {
  spaceId: string;
  space: FinancialSpace;
  spaces: FinancialSpace[];
  currency: string;
};
type Runtime = {
  lifetime: ReturnType<typeof createSpaceLifetime>;
  hasUnsavedChanges: () => boolean;
  registerDraft: (id: string, read: () => boolean) => () => void;
};
export type FinancialSpaceContext = Value & Runtime;
const Context = createContext<FinancialSpaceContext | null>(null);
type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
function read(control: Control) {
  return control instanceof HTMLInputElement &&
    (control.type === "checkbox" || control.type === "radio")
    ? String(control.checked)
    : control.value;
}

export function SpaceProvider({
  value,
  children,
}: {
  value: Value;
  children: ReactNode;
}) {
  const [lifetime] = useState(createSpaceLifetime);
  const controls = useRef(new Map<Control, string>());
  const drafts = useRef(new Map<string, () => boolean>());
  useLayoutEffect(() => {
    lifetime.stay();
    return () => lifetime.leave();
  }, [lifetime]);
  const registerDraft = useCallback((id: string, reader: () => boolean) => {
    drafts.current.set(id, reader);
    return () => {
      drafts.current.delete(id);
    };
  }, []);
  const hasUnsavedChanges = useCallback(() => {
    for (const [control, initial] of controls.current) {
      if (!control.isConnected) {
        controls.current.delete(control);
        continue;
      }
      if (read(control) !== initial) return true;
    }
    return [...drafts.current.values()].some((reader) => reader());
  }, []);
  function rememberControl(event: FormEvent<HTMLDivElement>) {
    const target = event.target;
    if (
      !(
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) ||
      !target.closest('form,[role="dialog"]') ||
      target.closest(".space-selector")
    )
      return;
    if (!controls.current.has(target))
      controls.current.set(target, read(target));
  }
  return (
    <Context.Provider
      value={{ ...value, lifetime, registerDraft, hasUnsavedChanges }}
    >
      <div style={{ display: "contents" }} onFocusCapture={rememberControl}>
        {children}
      </div>
    </Context.Provider>
  );
}
export function useOptionalFinancialSpace() {
  return useContext(Context);
}
export function useFinancialSpace() {
  const value = useContext(Context);
  if (!value)
    throw new Error("Cette action nécessite un espace financier explicite.");
  return value;
}

export function useSpaceDraft(dirty: boolean) {
  const context = useOptionalFinancialSpace();
  const register = context?.registerDraft;
  const id = useId();
  useLayoutEffect(() => register?.(id, () => dirty), [register, id, dirty]);
}

/** Button-based field controls need the same protection as native inputs. */
export function useSpaceDraftValues(values: Record<string, unknown>) {
  const [initial] = useState(() => JSON.stringify(values));
  useSpaceDraft(JSON.stringify(values) !== initial);
}
