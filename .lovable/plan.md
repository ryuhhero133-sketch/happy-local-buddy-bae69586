# Plano de Implementação: Painel de Anatomia Gráfica e Distribuição Elemental

Este plano descreve a implementação de um novo sistema na aba **Melhorias**, permitindo que os jogadores visualizem o potencial de sua conta através de um gráfico de radar ("Anatomia Gráfica") e distribuam pontos em atributos globais usando Stones Elementais e Livros.

## Alterações Propostas

### 1. Expansão do Estado do Jogo
- Modificar o `IdleState` em `src/routes/idle.tsx` para incluir `globalStats`:
    - `speed`: Nível de velocidade global.
    - `attack`: Nível de ataque global.
    - `synergy`: Nível de sinergia de time global.
    - `resistance`: Resistência elemental global.
    - `mastery`: Maestria elemental global.

### 2. Interface de Usuário (Aba Melhorias)
- **Gráfico de Anatomia Gráfica**:
    - Implementar um gráfico de radar usando SVG.
    - Os eixos representarão: Poder de Ataque, Defesa, Velocidade, Sinergia e Maestria Elemental.
    - Os valores serão calculados com base no time atual e nos upgrades globais.
- **Painel de Distribuição**:
    - Criar uma interface visualmente atraente (estilo RPG/MMO) para melhorar cada atributo.
    - Cada upgrade consumirá uma combinação de **Stones Elementais** e **Livros**.
    - Descrições detalhadas para cada atributo e o impacto no gameplay.

### 3. Lógica de Batalha e Atributos
- Integrar os bônus globais nos cálculos existentes:
    - O bônus de `attack` global será somado ao `buffs.atk`.
    - O bônus de `speed` afetará o intervalo de ataque (se aplicável) ou bônus de esquiva.
    - `synergy` aumentará a eficácia das sinergias de tier.
    - `resistance` reduzirá danos elementais recebidos.

## Detalhes Técnicos
- **Localização**: As alterações serão concentradas em `src/routes/idle.tsx`, especificamente na definição do tipo `IdleState`, na função `freshIdle` e no bloco condicional `tab === "melhorias"`.
- **Custo de Upgrade**: O custo aumentará progressivamente conforme o nível do atributo global.
- **Visual**: Uso de cores temáticas (Obsidiana e Ouro) e ícones de Stones/Livros já existentes no projeto.

## Próximos Passos
1. Atualizar a interface `IdleState` e o estado inicial.
2. Implementar o componente visual do gráfico de radar.
3. Adicionar os botões e lógica de upgrade consumindo itens.
4. Validar os bônus aplicados durante a simulação de batalha.
