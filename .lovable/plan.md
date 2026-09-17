# Loja do NPC no Pokémarkt

## O que será feito
- Adicionar a atendente enviada ao mapa Pokémarkt, mantendo animação direcional e movimento no padrão do NPC gordinho.
- Ao aproximar e conversar com ela, abrir uma loja personalizada usando a imagem enviada como estrutura visual.
- Preencher os espaços da loja com os itens já existentes e permitir selecionar, conferir preço e comprar.
- Reutilizar as regras atuais de saldo, inventário e compra para não alterar a economia do jogo.

## Detalhes técnicos
- Incluir a atendente no sistema de NPCs apenas em `mapinha10`.
- Criar um painel de loja sobreposto ao jogo, com fechamento, destaque do item selecionado e feedback de saldo insuficiente.
- Reaproveitar os ícones e manipuladores de compra existentes para Pokébolas, poções, livros e itens compatíveis.
- Validar abertura por interação, compra, fechamento e apresentação no Pokémarkt.
