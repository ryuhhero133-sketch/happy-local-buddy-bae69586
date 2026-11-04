import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, MessageCircle, Send } from "lucide-react";

export type HudMessage = { id: number; text: string; kind: string };
type Filter = "all" | "system" | "world" | "captures";

export function ChatHud({ messages }: { messages: HudMessage[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [collapsed, setCollapsed] = useState(false);
  const feed = useRef<HTMLDivElement>(null);
  const classify = (message: HudMessage) =>
    ["capture", "cap"].includes(message.kind) ? "captures" :
      /^(💬|🌍)/u.test(message.text) ? "world" : "system";
  const visible = messages.filter((message) => filter === "all" || classify(message) === filter);

  useEffect(() => {
    if (feed.current) feed.current.scrollTop = feed.current.scrollHeight;
  }, [messages, filter, collapsed]);

  return <section className={`revo-chat revo-panel ${collapsed ? "is-collapsed" : ""}`} aria-label="Chat e eventos">
    <div className="revo-chat__tabs" role="tablist" aria-label="Canais de mensagens">
      {([["all", "Global"], ["system", "Sistema"], ["world", "Mundo"], ["captures", "Capturas"]] as const).map(([id, label]) =>
        <button key={id} type="button" role="tab" aria-selected={filter === id} onClick={() => { setFilter(id); setCollapsed(false); }}>{label}</button>)}
      <button type="button" className="revo-chat__collapse" aria-label={collapsed ? "Expandir chat" : "Recolher chat"} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? <ChevronUp /> : <ChevronDown />}
      </button>
    </div>
    {!collapsed && <>
      <div ref={feed} className="revo-chat__feed" role="log" aria-label="Mensagens recentes">
        {visible.slice(-30).map((message) => <p key={message.id} data-kind={message.kind}>
          <span className="revo-chat__tag">[{classify(message) === "world" ? "Mundo" : classify(message) === "captures" ? "Captura" : "Sistema"}]</span>{" "}
          {message.text.replace(/^[💬🌍]\s*/u, "")}
        </p>)}
        {visible.length === 0 && <p className="revo-muted">Sua aventura começa aqui. Os eventos aparecerão neste painel.</p>}
      </div>
      <div className="revo-chat__input" title="O envio de mensagens globais está desativado nesta versão.">
        <MessageCircle aria-hidden="true" />
        <input aria-label="Mensagem global indisponível" disabled placeholder="Chat global indisponível nesta versão" />
        <button type="button" disabled aria-label="Envio de mensagens indisponível"><Send /></button>
      </div>
    </>}
  </section>;
}
