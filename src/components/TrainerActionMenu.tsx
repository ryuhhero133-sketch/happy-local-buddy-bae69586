type TrainerActionMenuProps = {
  name: string;
  onClose: () => void;
  onGuild?: () => void;
  onFriend?: () => void;
  onParty?: () => void;
  guildEnabled?: boolean;
  guildTitle?: string;
};

/**
 * Menu de ações exibido ao clicar em um treinador no mapa.
 * Jogadores reais executam as ações; os treinadores ambiente usam o mesmo
 * visual com ações vazias (apenas fecham o menu).
 */
export function TrainerActionMenu({
  name,
  onClose,
  onGuild,
  onFriend,
  onParty,
  guildEnabled = false,
  guildTitle,
}: TrainerActionMenuProps) {
  return (
    <div
      role="dialog"
      aria-label={`Ações para ${name}`}
      onClick={(event) => event.stopPropagation()}
      style={{
        position: "absolute", left: 42, top: -42, width: 178,
        padding: 7, borderRadius: 8, zIndex: 100,
        background: "linear-gradient(160deg, #182d52, #0b142a)",
        border: "2px solid #79c5ff",
        boxShadow: "0 5px 18px rgba(0,0,0,0.72)",
        fontFamily: '"Pixelify Sans", ui-monospace, monospace',
        cursor: "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }}>
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 9, fontWeight: 900, color: "#eaf7ff" }}>
          👤 {name}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar ações"
          style={{ width: 19, height: 19, padding: 0, borderRadius: 4, border: "1px solid #678cb5", color: "#d9edff", background: "#14233b", cursor: "pointer", fontWeight: 900 }}
        >×</button>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <button
          type="button"
          disabled={!guildEnabled}
          title={guildTitle ?? (guildEnabled ? "Enviar convite para a guilda" : "Crie ou entre em uma guilda primeiro")}
          onClick={() => { if (guildEnabled) onGuild?.(); }}
          style={{
            padding: "5px 6px", borderRadius: 5, border: "1px solid #3a9b65",
            background: guildEnabled ? "#1f7047" : "#34445a", color: guildEnabled ? "#ecffef" : "#9aafc6",
            cursor: guildEnabled ? "pointer" : "not-allowed", fontSize: 8, fontWeight: 900, textAlign: "left",
          }}
        >🏰 ADICIONAR À GUILDA</button>
        <button
          type="button"
          onClick={() => onFriend?.()}
          style={{
            padding: "5px 6px", borderRadius: 5, border: "1px solid #d4a94a",
            background: "#785e1d", color: "#fff7d7", cursor: "pointer", fontSize: 8, fontWeight: 900, textAlign: "left",
          }}
        >💚 ADICIONAR AMIGO</button>
        <button
          type="button"
          onClick={() => onParty?.()}
          style={{
            padding: "5px 6px", borderRadius: 5, border: "1px solid #4aa4e8",
            background: "#1f5f98", color: "#ebf8ff", cursor: "pointer", fontSize: 8, fontWeight: 900, textAlign: "left",
          }}
        >⚔️ JUNTAR À PARTY</button>
      </div>
    </div>
  );
}
