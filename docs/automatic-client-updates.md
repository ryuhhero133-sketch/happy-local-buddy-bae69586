# Atualizações automáticas do jogo

- Cada build incorpora o commit em `__APP_RELEASE_ID__`, tanto no navegador como no Worker.
- `GET /__app-version` retorna apenas `{ version }`, com `Cache-Control: no-store`, sem consultar o Supabase.
- O cliente consulta a versão a cada 75–90 segundos enquanto está visível e online. Uma versão diferente precisa ser confirmada novamente após 5 segundos.
- O aviso aparece por 6 segundos antes do salvamento. O jogador pode adiar por 5 minutos.
- Formulários, janelas abertas, captura em andamento, PvP, edição de mapa, hidratação e transações de checkpoint adiam o refresh.
- O automático é pausado temporariamente, os dados locais assinados são preservados e o checkpoint existente precisa confirmar o salvamento. Falha de rede ou de save mantém a página aberta e retoma o jogo. Após 20 segundos sem confirmação, o aviso libera a tela; a requisição pendente não é confundida com um save concluído.
- Imediatamente antes do reload são preservados posição, time, descanso, estado completo e fila durável do último frame.
- Uma proteção por aba impede loops se algum cache ainda servir o cliente antigo. Não apaga cache, sessão, login ou progresso.

**Primeira instalação:** jogadores com uma versão anterior ao mecanismo precisam carregar esta versão uma vez. Não há um comando remoto nos clientes antigos. Depois disso, novos deploys são detectados automaticamente.

## Verificação

```sh
node --test scripts/appUpdate.test.mjs
npx vite --config scripts/previews/vite.config.ts
# Em outro terminal, com Playwright disponível:
APP_UPDATE_BROWSER_TEST=1 node --test scripts/appUpdate-browser.test.mjs
```

As fixtures não usam contas, compras nem o Supabase real. A atualização fica desativada no desenvolvimento e no sandbox offline.
