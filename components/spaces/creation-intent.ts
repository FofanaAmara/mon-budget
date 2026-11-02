"use client";
const memory = new Map<string, string>();
export async function creationIntent(
  actor: string,
  context: string,
  name: string,
) {
  const hash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(name.trim()),
      ),
    ),
  )
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
  const storageKey = `financial-space-request:${actor}:${context}:${hash}`;
  let key = memory.get(storageKey);
  try {
    key ??= sessionStorage.getItem(storageKey) ?? undefined;
  } catch {}
  key ??= crypto.randomUUID();
  memory.set(storageKey, key);
  try {
    sessionStorage.setItem(storageKey, key);
  } catch {}
  return {
    key,
    clear: () => {
      memory.delete(storageKey);
      try {
        sessionStorage.removeItem(storageKey);
      } catch {}
    },
  };
}
