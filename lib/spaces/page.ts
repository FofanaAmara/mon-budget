import { getReceivedInvitations } from "@/lib/actions/invitations";
import { redirect, notFound } from "next/navigation";
import { getLastSpace, getSpaces } from "@/lib/actions/spaces";
import {
  requireIdentity,
  requireSpace,
  SpaceAccessError,
  UnauthenticatedSpaceError,
} from "./context";
import { spacePath } from "./paths";

function rejectPage(error: unknown): never {
  if (error instanceof UnauthenticatedSpaceError) redirect("/auth/sign-in");
  if (error instanceof SpaceAccessError) notFound();
  throw error;
}

export async function pageIdentity() {
  try {
    return await requireIdentity();
  } catch (error) {
    return rejectPage(error);
  }
}

export async function pageSpaceContext(spaceId: string) {
  try {
    return await requireSpace(spaceId);
  } catch (error) {
    return rejectPage(error);
  }
}

export async function pageSpace(params: Promise<{ spaceId: string }>) {
  const { spaceId } = await params;
  await pageSpaceContext(spaceId);
  return spaceId;
}

export async function redirectToLastSpace(href: string) {
  await pageIdentity();
  const last = await getLastSpace();
  if (last) redirect(spacePath(last.id, href));
  const spaces = await getSpaces();
  if (!spaces.length && (await getReceivedInvitations()).invitations.length)
    redirect("/invitations");
  redirect(spaces.length ? "/espaces" : "/onboarding");
}
