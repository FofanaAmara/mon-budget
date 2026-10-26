const financeRoot =
  /^\/(?:depenses|revenus|projets|cartes|sections|parametres)(?:[/?#]|$)/;

/** Only legacy financial paths are contextualized; auth/public/already explicit URLs remain intact. */
export function spacePath(spaceId: string, href: string): string {
  if (href === "/" || href.startsWith("/?") || href.startsWith("/#"))
    return `/espaces/${spaceId}${href.slice(1)}`;
  return financeRoot.test(href) ? `/espaces/${spaceId}${href}` : href;
}

export function localSpacePath(spaceId: string, pathname: string): string {
  const prefix = `/espaces/${spaceId}`;
  if (pathname === prefix) return "/";
  return pathname.startsWith(prefix + "/")
    ? pathname.slice(prefix.length)
    : pathname;
}
