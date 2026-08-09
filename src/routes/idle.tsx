import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/idle")({
  component: IdlePage,
});

function IdlePage() {
  return (
    <div style={{ padding: 20, color: "white", background: "#111", height: "100vh" }}>
      <h1>Sistema em Restauração</h1>
      <p>O arquivo do jogo está sendo recuperado dos backups automáticos. Por favor, aguarde.</p>
      <button onClick={() => window.location.reload()} style={{ padding: "10px 20px", cursor: "pointer" }}>Recarregar</button>
    </div>
  );
}
