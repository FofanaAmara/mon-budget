"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteExpense } from "@/lib/actions/expenses";
import { deleteDebt } from "@/lib/actions/debts";
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
import ProjetsFab from "@/components/projets/ProjetsFab";
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
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [createModal, setCreateModal] = useState(false);
  const [debtModal, setDebtModal] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [extraPayDebt, setExtraPayDebt] = useState<Debt | null>(null);
  const [chargeDebt, setChargeDebt] = useState<Debt | null>(null);
  const [savingsModal, setSavingsModal] = useState<Expense | null>(null);
  const [historyModal, setHistoryModal] = useState<Expense | null>(null);
  const [transferModal, setTransferModal] = useState<Expense | null>(null);

  const allPots = [freeSavings, ...projets];

  const freeSaved = Number(freeSavings.saved_amount ?? 0);
  const projectsSaved = projets.reduce(
    (s, p) => s + Number(p.saved_amount ?? 0),
    0,
  );
  const totalEpargne = freeSaved + projectsSaved;

  function handleDeleteProject(id: string) {
    if (confirm("Supprimer ce projet ?")) {
      startTransition(async () => {
        await deleteExpense(id);
        router.refresh();
      });
    }
  }

  function handleDeleteDebt(id: string) {
    if (confirm("Supprimer cette dette ?")) {
      startTransition(async () => {
        await deleteDebt(id);
        router.refresh();
      });
    }
  }

  function handleSavingsDone() {
    setSavingsModal(null);
    router.refresh();
  }

  function handleCreateDebt() {
    setEditDebt(null);
    setDebtModal(true);
  }

  function handleEditDebt(debt: Debt) {
    setEditDebt(debt);
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
        onAddSavings={(projet) => setSavingsModal(projet)}
        onTransfer={(projet) => setTransferModal(projet)}
        onHistory={(projet) => setHistoryModal(projet)}
        onDeleteProject={handleDeleteProject}
      />

      <DettesSection
        debts={debts}
        onCreateDebt={handleCreateDebt}
        onPay={(debt) => setExtraPayDebt(debt)}
        onCharge={(debt) => setChargeDebt(debt)}
        onEdit={handleEditDebt}
        onDelete={handleDeleteDebt}
      />

      <ProjetsFab
        onCreateProject={() => setCreateModal(true)}
        onCreateDebt={handleCreateDebt}
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
      {debtModal && (
        <DebtModal
          sections={sections}
          cards={cards}
          debt={editDebt}
          onClose={() => {
            setDebtModal(false);
            setEditDebt(null);
            router.refresh();
          }}
        />
      )}
      {extraPayDebt && (
        <ExtraPaymentSheet
          debt={extraPayDebt}
          onClose={() => setExtraPayDebt(null)}
        />
      )}
      {chargeDebt && (
        <ChargeDebtSheet
          debt={chargeDebt}
          onClose={() => setChargeDebt(null)}
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
          onClose={() => setSavingsModal(null)}
        />
      )}
      {transferModal && (
        <TransferSavingsModal
          source={transferModal}
          allPots={allPots}
          onDone={() => {
            setTransferModal(null);
            router.refresh();
          }}
          onClose={() => setTransferModal(null)}
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
            setHistoryModal(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
