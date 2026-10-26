"use client";

import { useState, type ReactNode } from "react";
import { redirect } from "next/navigation";

export default function OnboardingEntry({
  destination,
  children,
}: {
  destination: "/espaces" | "/invitations" | null;
  children: ReactNode;
}) {
  // Creating the space revalidates this page. Keep its recovery form mounted;
  // only a fresh visit should follow the newly available entry destination.
  const [entryDestination] = useState(destination);
  if (entryDestination) redirect(entryDestination);
  return children;
}
