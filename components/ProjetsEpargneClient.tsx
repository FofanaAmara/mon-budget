"use client";
import { useFinancialSpace } from "@/components/spaces/SpaceContext";


import { useState, useTransition } from "react";
import {useFinancialRouter as useRouter} from "@/components/spaces/navigation";
import { deleteExpense } from "@/lib/actions/financial/expenses";
import { deleteDebt } from "@/lib/actions/financial/debts";
import ProjectModal from "@/components/ProjectModal";
import DebtModal from "@/components/DebtModal";
import AddSavingsModal from "@/components/AddSavingsModal";
import SavingsHistoryModal from "@/components/SavingsHistoryModal";
import TransferSavingsModal from "@/components/TransferSavingsModal";
import PatrimoineMonument from "@/components/projets/PatrimoineMonument";
import EpargneSection from "@/components/projets/EpargneSection";
import DettesSection from "@/components/projets/DettesSection";
import ExtraPaymentSheet from "@/components/projets/ExtraPaymentSheet";
import ChargeDebtSheet from "@/components/projets/ChargeDebtSheet";
import type { Expense, Section, Card, Debt } from "@/lib/types";

type Props = {
  projets: Expense[];
  sections: Section[];
  cards: Card[];
  freeSavings: Expense;
  debts: Debt[];
  totalDebtBalance: number;
};

export default function ProjetsEpargneClient({
  projets,
  sections,
  cards,
  freeSavings,
  debts,
  totalDebtBalance,
}: Props) {
  const { spaceId } = useFinancialSpace();

  const router = useRouter();
  const [, startTransition] = useTransition();
  const [createModal, setCreateModal] = useState(false);
  const [debtModal, setDebtModal] = useState(false);
  const [editDebtId, setEditDebtId] = useState<string | null>(null);
  const [extraPayDebtId, setExtraPayDebtId] = useState<string | null>(null);
  const [chargeDebtId, setChargeDebtId] = useState<string | null>(null);
  const [savingsModalId, setSavingsModalId] = useState<string | null>(null);
  const [historyModalId, setHistoryModalId] = useState<string | null>(null);
  const [transferModalId, setTransferModalId] = useState<string | null>(null);

  const allPots = [freeSavings, ...projets];
  // Keep an open sheet aligned with server refreshes without replacing its draft.
  const editDebt = debts.find((debt) => debt.id === editDebtId) ?? null;
  const extraPayDebt = debts.find((debt) => debt.id === extraPayDebtId);
  const chargeDebt = debts.find((debt) => debt.id === chargeDebtId);
  const savingsModal = allPots.find((pot) => pot.id === savingsModalId);
  const historyModal = allPots.find((pot) => pot.id === historyModalId);
  const transferModal = allPots.find((pot) => pot.id === transferModalId);

  const freeSaved = Number(freeSavings.saved_amount ?? 0);
  const projectsSaved = projets.reduce(
    (s, p) => s + Number(p.saved_amount ?? 0),
    0,
  );
  const totalEpargne = freeSaved + projectsSaved;

  function handleDeleteProject(id: string) {
    if (confirm("Supprimer cet objectif ?")) {
      startTransition(async () => {
        await deleteExpense(spaceId, id);
        router.refresh();
      });
    }
  }

  function handleDeleteDebt(id: string) {
    if (confirm("Supprimer cette dette ?")) {
      startTransition(async () => {
        await deleteDebt(spaceId, id);
        router.refresh();
      });
    }
  }

  function handleSavingsDone() {
    setSavingsModalId(null);
    router.refresh();
  }

  function handleCreateDebt() {
    setEditDebtId(null);
    setDebtModal(true);
  }

  function handleEditDebt(debt: Debt) {
    setEditDebtId(debt.id);
    setDebtModal(true);
  }

  return (
    <div style={{ padding: "0 0 120px", minHeight: "100vh" }}>
      <PatrimoineMonument
        totalEpargne={totalEpargne}
        totalDebtBalance={totalDebtBalance}
        projetsCount={projets.length + 1}
        debtsCount={debts.length}
      />

      <EpargneSection
        freeSavings={freeSavings}
        projets={projets}
        onCreateProject={() => setCreateModal(true)}
        onAddSavings={(projet) => setSavingsModalId(projet.id)}
        onTransfer={(projet) => setTransferModalId(projet.id)}
        onHistory={(projet) => setHistoryModalId(projet.id)}
        onDeleteProject={handleDeleteProject}
      />

      <DettesSection
        debts={debts}
        onCreateDebt={handleCreateDebt}
        onPay={(debt) => setExtraPayDebtId(debt.id)}
        onCharge={(debt) => setChargeDebtId(debt.id)}
        onEdit={handleEditDebt}
        onDelete={handleDeleteDebt}
      />

      {/* -- MODALS -- */}
      {createModal && (
        <ProjectModal
          sections={sections}
          onClose={() => {
            setCreateModal(false);
            router.refresh();
          }}
        />
      )}
      {debtModal && (editDebtId === null || editDebt) && (
        <DebtModal
          sections={sections}
          cards={cards}
          debt={editDebt}
          onClose={() => {
            setDebtModal(false);
            setEditDebtId(null);
            router.refresh();
          }}
        />
      )}
      {extraPayDebt && (
        <ExtraPaymentSheet
          debt={extraPayDebt}
          onClose={() => setExtraPayDebtId(null)}
        />
      )}
      {chargeDebt && (
        <ChargeDebtSheet
          debt={chargeDebt}
          onClose={() => setChargeDebtId(null)}
        />
      )}
      {savingsModal && (
        <AddSavingsModal
          expenseId={savingsModal.id}
          projectName={savingsModal.name}
          currentSaved={Number(savingsModal.saved_amount ?? 0)}
          targetAmount={
            savingsModal.target_amount !== null
              ? Number(savingsModal.target_amount)
              : null
          }
          onDone={handleSavingsDone}
          onClose={() => setSavingsModalId(null)}
        />
      )}
      {transferModal && (
        <TransferSavingsModal
          source={transferModal}
          allPots={allPots}
          onDone={() => {
            setTransferModalId(null);
            router.refresh();
          }}
          onClose={() => setTransferModalId(null)}
        />
      )}
      {historyModal && (
        <SavingsHistoryModal
          expenseId={historyModal.id}
          projectName={historyModal.name}
          currentSaved={Number(historyModal.saved_amount ?? 0)}
          targetAmount={
            historyModal.target_amount !== null
              ? Number(historyModal.target_amount)
              : null
          }
          onClose={() => {
            setHistoryModalId(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
