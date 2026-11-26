// Isolated fixture: mocked HTTP checkpoint, never Supabase or a real account.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { GameAutoUpdate } from "../../src/components/GameAutoUpdate";

function Preview() {
  const [busy, setBusy] = useState(false);
  const snapshot = { gold: 521111, level: 18, pokemon: "pikachu" };
  return <main>
    <h1>Atualização automática — prévia local</h1>
    <p id="fixture-result">{localStorage.getItem("fixture.update-progress") ? "Progresso restaurado" : "Jogando normalmente"}</p>
    <label><input type="checkbox" checked={busy} onChange={(event) => setBusy(event.target.checked)} /> Ação em andamento (não pode atualizar)</label>
    <GameAutoUpdate enabled canReload={() => !busy}
      prepareReload={async () => {
        localStorage.setItem("fixture.update-started", "true");
        const result = await fetch("/fixture-checkpoint", { method: "POST" });
        return result.ok && (await result.json()).ok === true;
      }}
      persistLatest={() => {
        localStorage.setItem("fixture.update-progress", JSON.stringify(snapshot));
        return true;
      }}
      cancelReload={() => sessionStorage.setItem("fixture.update-resumed", "true")} />
  </main>;
}
createRoot(document.getElementById("root")!).render(<Preview />);
