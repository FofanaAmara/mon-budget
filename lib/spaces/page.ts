import { getReceivedInvitations } from "@/lib/actions/invitations";
import { redirect } from "next/navigation";
import { getLastSpace, getSpaces } from "@/lib/actions/spaces";
import { requireSpace } from "./context";
import { spacePath } from "./paths";

export async function pageSpace(params: Promise<{ spaceId: string }>) {
  const { spaceId } = await params;
  await requireSpace(spaceId);
  return spaceId;
}

export async function redirectToLastSpace(href: string) {
  const last = await getLastSpace();
  if (last) redirect(spacePath(last.id, href));
  const spaces = await getSpaces();
  if (!spaces.length && (await getReceivedInvitations()).invitations.length)
    redirect("/invitations");
  redirect(spaces.length ? "/espaces" : "/onboarding");
}
