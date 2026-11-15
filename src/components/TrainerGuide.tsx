import { useState } from "react";
import portrait from "@/assets/npc-oak.png";

const pages = [
  "Olá, treinador! Este guia é opcional. Feche quando quiser e abra novamente pelo botão de ajuda.",
  "Para viajar, abra o Mapa Mundi, escolha um destino liberado e toque em Teleportar. As viagens liberadas são gratuitas.",
  "Comece em Verdejante 1; depois explore Valley Plume, Florest Ice e Florest Bone. Os níveis exibidos nos mapas descrevem os Pokémon que você encontrará.",
  "No Pokemarkt, escolha um item, ajuste a quantidade e confirme a compra. Para sair, abra o Mapa Mundi e volte a Revoland.",
  "Para capturar, leve Pokébolas na Mochila e ative a captura automática. Durante os encontros, o jogo tenta capturar conforme as regras da batalha.",
  "Em Pokémon e Coleção você organiza seu time; na Mochila usa itens; em Eventos encontra recompensas; em Configurações ajusta áudio e controles. Boa jornada!",
];

export function TrainerGuide({ accountId }: { accountId: string }) {
  const key = `rubym.guide.seen.${accountId}`;
  const [open, setOpen] = useState(() => typeof window !== "undefined" && !localStorage.getItem(key));
  const [page, setPage] = useState(0);
  const close = () => { localStorage.setItem(key, "1"); setOpen(false); };
  return (
    <div style={{ position: "fixed", bottom: 12, left: 12, zIndex: 12001, maxWidth: "min(540px, calc(100vw - 24px))" }}>
      {open ? (
        <section aria-label="Guia do treinador" style={{ display: "flex", gap: 10, padding: 12, border: "2px solid #d5b66d", borderRadius: 12, background: "#142632", color: "#eef8ef", boxShadow: "0 8px 28px #000a", maxHeight: "min(45dvh, 280px)", overflowY: "auto" }}>
          <img src={portrait} alt="Guia do treinador" style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
          <div>
            <strong style={{ color: "#ffe39c", fontSize: 12 }}>GUIA DO TREINADOR</strong>
            <p style={{ fontSize: 13, lineHeight: 1.4, margin: "6px 0 10px" }}>{pages[page]}</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" onClick={close}>Fechar</button>
              <button type="button" onClick={() => page === pages.length - 1 ? close() : setPage(page + 1)}>{page === pages.length - 1 ? "Concluir" : "Próximo →"}</button>
              <small>{page + 1}/{pages.length}</small>
            </div>
          </div>
        </section>
      ) : <button type="button" onClick={() => { setPage(0); setOpen(true); }} aria-label="Abrir guia do treinador" style={{ padding: "7px 10px", borderRadius: 9, background: "#142632", color: "#ffe39c", border: "1px solid #d5b66d", cursor: "pointer" }}>❔ Guia</button>}
    </div>
  );
}
