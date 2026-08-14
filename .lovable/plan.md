# Plan - Main Quest System

Implement a "Main Quest" system displayed near the chat HUD, featuring rarity/species capture requirements and tiered rewards (Ultra Balls, Red Shards, Epic Eggs).

## Technical Details

- **Quest Definition**: Create a `QUEST_DATA` structure in `src/routes/idle.tsx` defining sequential quests.
- **State Management**: Add `mainQuest` to `IdleState` in `src/routes/idle.tsx` to track `currentQuestId` and `progress`.
- **UI Component**: Create `MainQuestHUD` in `src/routes/idle.tsx` to display the current objective near the chat panel.
- **Logic Integration**: 
    - Update progress in the capture logic (around `setIdle` in `setEnemies` callback).
    - Implement a "Claim Reward" mechanism that grants items/shards and advances to the next quest.
- **Initial Quests**:
    - Quest 1: "Capture 10 Uncommon Pokémon" -> Reward: 10 Ultra Balls.
    - Quest 2: "Capture 5 Rare Pokémon" -> Reward: 50 Red Shards.
    - Quest 3: "Capture 3 Epic Pokémon" -> Reward: 100 Red Shards.
    - Quest 4: "Capture 1 Legendary Pokémon" -> Reward: 1 Epic Egg.
    - Quest 5: "Capture a specific species (e.g., Pikachu)" -> Reward: 200 Red Shards.

## Proposed Changes

### `src/routes/idle.tsx`

- Add `Quest` types and `QUEST_DATA`.
- Update `IdleState` and `freshIdle` to include `mainQuest`.
- Modify the capture logic to increment `mainQuest.progress` if the requirements match.
- Add the `MainQuestHUD` component and render it above or near the chat panel.
- Implement `claimMainQuestReward` function.
- Update `src/routes/index.tsx` to remove the request text as it's being implemented.
