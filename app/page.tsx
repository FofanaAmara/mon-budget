import { redirectToLastSpace } from "@/lib/spaces/page";
export const dynamic = "force-dynamic";
export default async function Entry({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    for (const entry of Array.isArray(value)
      ? value
      : value === undefined
        ? []
        : [value])
      query.append(key, entry);
  await redirectToLastSpace("/" + (query.size ? "?" + query.toString() : ""));
}
