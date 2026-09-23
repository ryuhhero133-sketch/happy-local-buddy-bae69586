import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function MetaMaskLoginButton() {
  const [status, setStatus] = useState<string>("");

  const handleMetaMaskLogin = async () => {
    setStatus("Conectando carteira...");
    try {
      if (typeof window === "undefined" || !(window as any).ethereum) {
        setStatus("MetaMask não instalado. Instale a extensão.");
        return;
      }
      // Solicita contas — não lê private keys
      const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts || !accounts[0]) {
        setStatus("Carteira rejeitada ou desconectada.");
        return;
      }
      // Usa Supabase Auth Web3 nativo (EIP-4361 / SIWE via janela do navegador)
      const { error } = await supabase.auth.signInWithWeb3({
        chain: 'ethereum',
        statement: 'Sign in to IDLE MON REVO.',
      });
      if (error) {
        setStatus("Erro de autenticação: " + error.message);
        return;
      }
      setStatus("Autenticado via Web3 — passando pelo AuthGate.");
    } catch (err: any) {
      if (err?.code === 4001 || err?.message?.includes("rejected")) {
        setStatus("Assinatura rejeitada pelo usuário.");
      } else if (err?.message?.includes("network")) {
        setStatus("Rede não suportada. Verifique a rede ativa.");
      } else {
        setStatus("Erro: " + (err?.message || err));
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleMetaMaskLogin}
        className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-black font-black uppercase tracking-widest px-4 py-3 rounded shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        aria-label="Entrar com MetaMask"
      >
        <span>ENTRAR COM METAMASK</span>
      </button>
      {status && (
        <p className="text-xs text-amber-300 font-mono text-center break-all">{status}</p>
      )}
    </div>
  );
}
