import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FlaskConical, Sparkles } from "lucide-react";
import { ItemPixelIcon } from "@/components/ItemPixelIcon";
import type { LucideIcon } from "lucide-react";

// Types
export type Species = string;
export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic" | "mythic_shiny";
export type CollectionEntry = {
  uid: string;
  species: Species;
  level: number;
  rarity: Rarity;
  capturedAt: number;
};

export const Route = createFileRoute("/idle")({
  component: IdleGame,
});

function IdleGame() {
  const [tab, setTab] = useState("inicio");
  return (
    <div style={{ padding: 20, color: 'white' }}>
      <h1>Idle Game (Restaurando...)</h1>
      <p>O sistema está sendo restaurado para corrigir um erro crítico de sintaxe. Por favor, aguarde.</p>
      <button onClick={() => window.location.reload()}>Recarregar</button>
    </div>
  );
}

// ... helper components could go here if needed to avoid build breaks in other files
