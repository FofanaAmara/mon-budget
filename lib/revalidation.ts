/**
 * Centralized revalidatePath helpers.
 * Extracted from repeated revalidatePath() call patterns across server actions.
 */

import { revalidatePath } from "next/cache";

/** Revalidate expense-related pages (depenses + home). */
export function revalidateExpensePages() {
  revalidatePath("/depenses");
  revalidatePath("/");
}

/** Revalidate income-related pages (revenus + home). */
export function revalidateIncomePages() {
  revalidatePath("/revenus");
  revalidatePath("/");
}

/** Revalidate project/savings-related pages (projets + home). */
export function revalidateProjectPages() {
  revalidatePath("/projets");
  revalidatePath("/");
}

/** Revalidate debt-related pages (projets + home). */
export function revalidateDebtPages() {
  revalidatePath("/projets");
  revalidatePath("/");
}

/** Revalidate all main pages (used after bulk operations like claim, demo data, clear). */
export function revalidateAllPages() {
  revalidatePath("/");
  revalidatePath("/depenses");
  revalidatePath("/revenus");
  revalidatePath("/projets");
  revalidatePath("/parametres");
  revalidatePath("/cartes");
  revalidatePath("/sections");
}
