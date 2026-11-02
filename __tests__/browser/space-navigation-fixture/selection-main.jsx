import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import ProjetsEpargneClient from "@/components/ProjetsEpargneClient";
import { SpaceProvider } from "@/components/spaces/SpaceContext";
import { Navigation } from "./router";

const spaceId = "11111111-1111-4111-8111-111111111111";
const space = { id: spaceId, name: "Recette", memberCount: 1, createdAt: "" };
const freeSavings = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Épargne libre", type: "PLANNED", system_kind: "FREE_SAVINGS",
  saved_amount: 0, target_amount: null,
};
const project = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "Objectif de recette", type: "PLANNED",
  saved_amount: 123.45, target_amount: 1000,
};
const debt = {
  id: "44444444-4444-4444-8444-444444444444",
  name: "Dette de recette", remaining_balance: 500, original_amount: 500,
  payment_amount: 50, payment_frequency: "MONTHLY", interest_rate: 0,
};
const router = {
  push() {}, replace() {}, refresh() {}, back() {}, forward() {}, prefetch() {},
};

function App() {
  const [updated, setUpdated] = useState(false);
  const [removed, setRemoved] = useState(false);
  const debts = removed ? [] : [{ ...debt, remaining_balance: updated ? 525.5 : 500 }];
  return (
    <Navigation.Provider value={{ router, pathname: `/espaces/${spaceId}/projets` }}>
      <SpaceProvider value={{ spaceId, space, spaces: [space], currency: "CAD" }}>
        <aside style={{ position: "fixed", top: 0, left: 0, zIndex: 200 }}>
          <button onClick={() => setUpdated(true)}>Actualiser les données</button>
          <button onClick={() => setRemoved(true)}>Retirer la dette</button>
        </aside>
        <ProjetsEpargneClient
          projets={[{ ...project, saved_amount: updated ? 200 : 123.45 }]}
          sections={[]} cards={[]} freeSavings={freeSavings}
          debts={debts} totalDebtBalance={removed ? 0 : updated ? 525.5 : 500}
        />
      </SpaceProvider>
    </Navigation.Provider>
  );
}
createRoot(document.getElementById("root")).render(<App />);
