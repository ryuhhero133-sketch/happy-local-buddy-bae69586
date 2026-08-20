# Plano: Sistema de Equipamentos do Treinador

Implementar a lógica de interação para o painel de equipamentos, incluindo o modal de seleção de itens e a aplicação dos bônus de status (XP, Gold, Drop, Velocidade).

## Tarefas

### 1. Preparação da Interface (idle.tsx)
- Criar estado para controlar qual slot está sendo editado (`equipmentSlotPicker: EquipmentSlot | null`).
- Criar função `onEquipItem(slot, itemId)` para atualizar o estado de equipamentos.

### 2. Modal de Seleção de Equipamento
- Implementar um modal RPG elegante que mostre os itens disponíveis para o slot selecionado.
- Exibir nome, raridade e bônus de cada item.
- Adicionar som de clique ao equipar.

### 3. Aplicação de Bônus (Cálculos de Jogo)
- Criar um hook ou função utilitária `getTrainerStats()` que some todos os bônus dos itens equipados.
- Integrar esses bônus nos sistemas de:
    - Ganho de XP (Pokémon e Treinador).
    - Drop de Ouro.
    - Taxa de captura/Drop de itens.
    - Velocidade de ataque/movimentação.

### 4. Refinamento Visual
- Adicionar tooltips ao passar o mouse nos slots equipados.
- Garantir que o "Guarda-Roupa" (Skins) e "Equipamento" coexistam harmoniosamente na aba Início.

## Detalhes Técnicos
- O estado `equippedItems` já está persistindo no `localStorage`.
- Utilizar os dados de `TRAINER_EQUIPMENT_DATA` definidos em `systems.tsx`.
- Cores de raridade vindas de `RARITY_COLOR`.
