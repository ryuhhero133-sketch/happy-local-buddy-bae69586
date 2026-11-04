# Local Keeper

DEIXAR O PROJETO RODANDO.  LOCAL STORAGE POR ENQUANTO PORQUE EU IANDA VOU LIGAR ELE AO SUPABASE, PROJETO NAO TERA NENHUMA CONEXÃO COM LOVABLE CLOUD.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://happy-local-buddy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/39aa2396-dc77-4d85-bc32-88987ac4d239).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

### Teste offline local (sem MetaMask)

No servidor de desenvolvimento em `http://localhost:8080/idle`, clique em
**LOGIN TEST**. O botão só aparece em localhost/loopback, nunca no build de produção.
O sandbox depende de `src/lib/offlineTest.local.ts`, arquivo privado ignorado
pelo Git. Sem esse arquivo, até o desenvolvimento usa o login normal. A versão
de produção elimina o botão e não carrega o sandbox.

- Não cria sessão Supabase nem pede assinatura da carteira.
- Saves de teste usam o prefixo `idlemon.test:` no localStorage, separados dos saves reais.
- Chamadas ao backend e conexões realtime remotas ficam bloqueadas durante o teste.
- Recursos online (mercado, ranking, multiplayer, compras e salvamento na nuvem) não estão disponíveis.
- F5 mantém o teste; **Sair do teste** volta ao login normal sem apagar seu progresso de teste.
- Na primeira entrada, escolha o visual/nome e o Pokémon inicial normalmente.
