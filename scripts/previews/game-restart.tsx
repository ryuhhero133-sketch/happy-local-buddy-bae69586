// Isolated fixture: mocked HTTP checkpoint, never Supabase or a real account.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { GameRestartPrompt } from "../../src/components/GameRestartPrompt";

function Preview() {
  const [busy, setBusy] = useState(false);
  const [signal, setSignal] = useState<number | null>(null);
  const snapshot = { gold: 521111, level: 18, pokemon: "pikachu" };
  return <main>
    <h1>Reinício manual — prévia local</h1>
    <p id="fixture-result">{localStorage.getItem("fixture.restart-progress") ? "Progresso restaurado" : "Jogando normalmente"}</p>
    <button id="simulate" type="button" onClick={() => setSignal((value) => (value ?? 1) + 1)}>Simular atualização importante</button>
    <label><input type="checkbox" checked={busy} onChange={(event) => setBusy(event.target.checked)} /> Ação em andamento (não pode reiniciar)</label>
    <GameRestartPrompt enabled signal={signal} canRestart={() => !busy}
      prepareRestart={async () => {
        const result = await fetch("/fixture-checkpoint", { method: "POST" });
        return result.ok && (await result.json()).ok === true;
      }}
      persistLatest={() => {
        localStorage.setItem("fixture.restart-progress", JSON.stringify(snapshot));
        return true;
      }}
      cancelRestart={() => sessionStorage.setItem("fixture.restart-resumed", "true")} />
  </main>;
}
createRoot(document.getElementById("root")!).render(<Preview />);
