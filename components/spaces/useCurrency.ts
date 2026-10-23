"use client";
import { useCallback } from "react";
import { formatCAD } from "@/lib/utils";
import { useOptionalFinancialSpace } from "./SpaceContext";
export function useSpaceCurrency() {
  const currency = useOptionalFinancialSpace()?.currency ?? "CAD";
  return useCallback(
    (amount: number, override?: string) =>
      formatCAD(amount, override ?? currency),
    [currency],
  );
}
