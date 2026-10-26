"use client";

import NextLink from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useMemo, useRef, useLayoutEffect, type ComponentProps } from "react";
import { useOptionalFinancialSpace } from "./SpaceContext";
import { spacePath, localSpacePath } from "@/lib/spaces/paths";

export default function FinancialLink({
  href,
  ...props
}: ComponentProps<typeof NextLink>) {
  const context = useOptionalFinancialSpace();
  const target = !context
    ? href
    : typeof href === "string"
      ? spacePath(context.spaceId, href)
      : {
          ...href,
          pathname: href.pathname
            ? spacePath(context.spaceId, href.pathname)
            : href.pathname,
        };
  return <NextLink {...props} href={target} />;
}

export function useFinancialRouter() {
  const router = useRouter();
  const context = useOptionalFinancialSpace();
  const spaceId = context?.spaceId;
  const mounted = useRef(true);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const lifetime = context?.lifetime;
  return useMemo(() => {
    const active = () => mounted.current && (!lifetime || lifetime.isActive());
    return {
      ...router,
      push: (
        href: string,
        ...args: Parameters<typeof router.push> extends [string, ...infer R]
          ? R
          : never
      ) =>
        active() &&
        router.push(spaceId ? spacePath(spaceId, href) : href, ...args),
      replace: (
        href: string,
        ...args: Parameters<typeof router.replace> extends [string, ...infer R]
          ? R
          : never
      ) =>
        active() &&
        router.replace(spaceId ? spacePath(spaceId, href) : href, ...args),
      prefetch: (
        href: string,
        ...args: Parameters<typeof router.prefetch> extends [string, ...infer R]
          ? R
          : never
      ) =>
        active() &&
        router.prefetch(spaceId ? spacePath(spaceId, href) : href, ...args),
      refresh: () => {
        if (active()) router.refresh();
      },
      back: () => {
        if (active()) router.back();
      },
      forward: () => {
        if (active()) router.forward();
      },
    };
  }, [router, spaceId, lifetime]);
}

export function useFinancialPathname() {
  const pathname = usePathname();
  const context = useOptionalFinancialSpace();
  return context ? localSpacePath(context.spaceId, pathname) : pathname;
}
