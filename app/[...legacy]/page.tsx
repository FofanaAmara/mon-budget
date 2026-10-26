import { notFound } from "next/navigation";
import { redirectToLastSpace } from "@/lib/spaces/page";
export const dynamic = "force-dynamic";
export default async function LegacyEntry({
  params,
  searchParams,
}: {
  params: Promise<{ legacy: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { legacy } = await params;
  if (
    ![
      "depenses",
      "revenus",
      "projets",
      "cartes",
      "sections",
      "parametres",
    ].includes(legacy[0])
  )
    notFound();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams))
    for (const entry of Array.isArray(value)
      ? value
      : value === undefined
        ? []
        : [value])
      query.append(key, entry);
  await redirectToLastSpace(
    "/" +
      legacy.map(encodeURIComponent).join("/") +
      (query.size ? "?" + query.toString() : ""),
  );
}
