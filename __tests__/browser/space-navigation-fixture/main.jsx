import React, { useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import {
  SpaceProvider,
  useSpaceDraftValues,
} from "@/components/spaces/SpaceContext";
import SpaceSelector from "@/components/spaces/SpaceSelector";
import { useFinancialRouter } from "@/components/spaces/navigation";
import { Navigation } from "./router";
const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222";
const spaces = [
  { id: A, name: "Personnel", memberCount: 1, createdAt: "" },
  { id: B, name: "Couple", memberCount: 2, createdAt: "" },
];
window.preferenceRequests = [];
window.navigationRequests = [];
function Editor() {
  const router = useFinancialRouter();
  const [frequency, setFrequency] = useState("MONTHLY");
  useSpaceDraftValues({ frequency });
  const [waiting, setWaiting] = useState(false);
  return (
    <>
      <button onClick={() => setFrequency("YEARLY")}>Fréquence annuelle</button>
      <form>
        <label>
          Nom du brouillon
          <input aria-label="Nom du brouillon" defaultValue="" />
        </label>
      </form>
      <button
        onClick={async () => {
          setWaiting(true);
          await new Promise((resolve) => {
            window.resolveOldSave = resolve;
          });
          router.push("/depenses");
          router.refresh();
          setWaiting(false);
        }}
      >
        Sauvegarde retardée
      </button>
      {waiting && <p>Enregistrement en attente</p>}
    </>
  );
}
function App() {
  const [outside, setOutside] = useState(false);
  const [active, setActive] = useState(A);
  const [page, setPage] = useState("/");
  const router = useMemo(
    () => ({
      push: (href) => {
        window.navigationRequests.push(href);
        const match = href.match(/^\/espaces\/([^/]+)(.*)$/);
        if (match) {
          setActive(match[1]);
          setPage(match[2] || "/");
        }
      },
      replace: () => {},
      refresh: () => {
        window.refreshes = (window.refreshes || 0) + 1;
      },
      back: () => {},
      forward: () => {},
      prefetch: () => {},
    }),
    [],
  );
  const space = spaces.find((row) => row.id === active);
  return (
    <Navigation.Provider
      value={{
        router,
        pathname: `/espaces/${active}${page === "/" ? "" : page}`,
      }}
    >
      <button onClick={() => setOutside(true)}>Compte</button>
      {outside ? (
        <h1>Compte</h1>
      ) : (
        <SpaceProvider
          key={active}
          value={{ spaceId: active, space, spaces, currency: "CAD" }}
        >
          <h1>{space.name}</h1>
          <output aria-label="Page actuelle">{page}</output>
          <SpaceSelector />
          <Editor />
        </SpaceProvider>
      )}
    </Navigation.Provider>
  );
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
