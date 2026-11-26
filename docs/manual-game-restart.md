# Reinício manual do jogo

Não existe consulta automática de versão. O jogo **não verifica atualizações a cada minuto**.

## Como funciona

- A conta principal vê **MENU → Reiniciar jogadores**.
- O botão abre uma confirmação com duas opções:
  - **Só meu jogo** — salva este dispositivo e recarrega só ele.
  - **Todos online** — grava uma solicitação única no Supabase; jogadores online recebem por Realtime, salvam o progresso e recarregam.
- A solicitação usa a função `request_game_client_refresh()`, que só aceita a conta `16d47359-8fbb-4a81-9596-918b2d53b75b`.
- Clientes só têm permissão de leitura na tabela `game_client_refresh`; ninguém além do dono consegue disparar o reinício.
- A tabela é publicada no Realtime. Não há polling HTTP, cron ou verificação periódica de versão.

## Segurança do salvamento

Antes de recarregar, o cliente:

- pausa o Auto apenas em memória;
- limpa teclas e destino de caminhada;
- espera duas frames para a interface de salvamento aparecer;
- grava posição, time, banco, coleção e estado completo no save local assinado;
- grava também o último frame na fila durável do checkpoint;
- aguarda a confirmação do checkpoint na nuvem;
- preserva o estado mais recente mais uma vez, imediatamente antes do refresh.

Se o jogador estiver em compra, formulário, PvP, captura, edição de mapa ou outra ação sensível, o aviso fica visível e tenta de novo a cada 2 segundos **sem consultar a rede**. Se o salvamento falhar, a tela continua aberta e o jogo é retomado; uma nova tentativa ocorre após 15 segundos. Um save travado libera a tela após 20 segundos, sem forçar o refresh.

## Verificação

```sh
node --test scripts/gameRestart.test.mjs scripts/gameRestart-save.test.mjs
npx vite --config scripts/previews/vite.config.ts
# Em outro terminal, com Playwright disponível:
GAME_RESTART_BROWSER_TEST=1 node --test scripts/gameRestart-browser.test.mjs
```

A prévia usa um checkpoint simulado. Não acessa conta, compras, Supabase real nem o save de produção.

## Limite importante

Este mecanismo não consegue atualizar uma página aberta antes de o jogador carregar esta versão pela primeira vez. Depois que ele entrar nesta versão, o botão do dono passa a alcançá-lo enquanto estiver online.
