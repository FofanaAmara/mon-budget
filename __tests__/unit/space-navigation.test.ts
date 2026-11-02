import { describe, test, expect, vi } from "vitest";
import { spacePath, localSpacePath } from "@/lib/spaces/paths";
import { createSpaceLifetime } from "@/lib/spaces/navigation-lifetime";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

describe("explicit financial navigation", () => {
  test("links, entities and query state retain their originating space", () => {
    expect(spacePath("A", "/")).toBe("/espaces/A");
    expect(spacePath("A", "/?month=2026-10#total")).toBe(
      "/espaces/A?month=2026-10#total",
    );
    expect(spacePath("A", "/depenses/expense/edit?mode=full")).toBe(
      "/espaces/A/depenses/expense/edit?mode=full",
    );
    expect(spacePath("A", "/parametres/espace/B")).toBe(
      "/espaces/A/parametres/espace/B",
    );
  });
  test("an explicit other space and external/auth/public paths never inherit the active space", () => {
    for (const href of [
      "/espaces/B/depenses",
      "/auth/sign-in",
      "/account/settings",
      "/invitation/token",
      "https://example.test/depenses",
      "//example.test/depenses",
      "#total",
      "?month=2026-10",
      "/depenses-autre",
    ]) {
      expect(spacePath("A", href)).toBe(href);
    }
  });
  test("active navigation matching respects the full space ID boundary", () => {
    expect(localSpacePath("A", "/espaces/A")).toBe("/");
    expect(localSpacePath("A", "/espaces/A/parametres")).toBe("/parametres");
    expect(localSpacePath("A", "/espaces/AB/depenses")).toBe(
      "/espaces/AB/depenses",
    );
  });
  test("late work retains the abandoned lifetime; a new space owns an independent one", async () => {
    const old = createSpaceLifetime(),
      current = createSpaceLifetime(),
      navigate = vi.fn();
    let release!: () => void;
    const saving = (async () => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      if (old.isActive()) navigate("A");
    })();
    old.leave();
    release();
    await saving;
    expect(navigate).not.toHaveBeenCalled();
    expect(current.isActive()).toBe(true);
    old.stay();
    expect(old.isActive()).toBe(true);
  });
});

describe("service worker private-data boundary (unit, not browser offline proof)", () => {
  function worker() {
    const handlers: Record<string, (event: unknown) => void> = {};
    const cache = {
      addAll: vi.fn(async () => {}),
      match: vi.fn(async () => ({ asset: true })),
    };
    const caches = {
      open: vi.fn(async () => cache),
      keys: vi.fn(async () => [
        "mes-finances-v2",
        "mes-finances-static-v3",
        "unrelated-app",
      ]),
      delete: vi.fn(async () => true),
    };
    const self = {
      location: { origin: "https://budget.test" },
      addEventListener: (name: string, callback: (event: unknown) => void) => {
        handlers[name] = callback;
      },
      skipWaiting: vi.fn(),
      clients: { claim: vi.fn(async () => {}) },
    };
    const fetch = vi.fn(async () => ({ network: true }));
    runInNewContext(readFileSync("public/sw.js", "utf8"), {
      self,
      caches,
      fetch,
      URL,
    });
    return { handlers, caches, cache, self, fetch };
  }
  test("financial HTML, auth, RSC and API responses never consult CacheStorage", () => {
    const app = worker();
    for (const path of [
      "/",
      "/depenses",
      "/espaces/A/depenses",
      "/espaces/B?_rsc=abc",
      "/auth/sign-in",
      "/api/auth/session",
    ]) {
      const respondWith = vi.fn();
      app.handlers.fetch({
        request: { method: "GET", url: "https://budget.test" + path },
        respondWith,
      });
      expect(respondWith).not.toHaveBeenCalled();
    }
    expect(app.caches.open).not.toHaveBeenCalled();
    expect(app.fetch).not.toHaveBeenCalled();
  });
  test("installation caches only public icons", async () => {
    const app = worker();
    let result: Promise<void> | undefined;
    app.handlers.install({
      waitUntil: (promise: Promise<void>) => {
        result = promise;
      },
    });
    await result;
    expect(app.cache.addAll).toHaveBeenCalledWith([
      "/icons/icon-192.png",
      "/icons/icon-512.png",
      "/icons/favicon.svg",
    ]);
  });
  test("activation removes old app caches while preserving unrelated caches", async () => {
    const app = worker();
    let result: Promise<void> | undefined;
    app.handlers.activate({
      waitUntil: (promise: Promise<void>) => {
        result = promise;
      },
    });
    await result;
    expect(app.caches.delete).toHaveBeenCalledExactlyOnceWith(
      "mes-finances-v2",
    );
    expect(app.self.clients.claim).toHaveBeenCalledOnce();
  });
});
