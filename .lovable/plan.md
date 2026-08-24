---
title: Trainer's House & Scientist NPC
description: Implemented the Scientist NPC in the trainer's house, removed fake players from the map, and ensured no spawns in the house.
technical_details:
- Replaced NPC Elyra with a new Scientist NPC using the uploaded sprite sheet.
- Implemented sprite sheet animation and movement for the Scientist NPC.
- Filtered `visibleMapPlayers` to remove `fakeMapPlayers` from the map view.
- Enforced zero spawns in the `casa_do_treinador` map by hardening the spawn logic.
- Added interaction dialogue for the Scientist NPC.
---

# Plan - Trainer's House & Scientist NPC

Reorganizing the trainer's house to be a private, safe zone with a new interactive NPC.

## User Review Required

> [!IMPORTANT]
> The Scientist NPC has been added to your house. She will move around and talk to you when approached. "Fake" players have been removed from your view to keep the experience private.

- **NPC Change**: Elyra has been replaced by the Scientist.
- **Privacy**: Other "fake" players are no longer visible on your map.
- **Safety**: No Pokémon will spawn inside the house.

## Proposed Changes

### Assets
- Create asset pointer for `user-uploads://NPC_055_Scientist_F.png` at `src/assets/npc-scientist-f.png.asset.json`.

### Game Logic & UI (`src/routes/idle.tsx`)
- Import the new scientist asset.
- Update `visibleMapPlayers` to only include real `remotePlayers`, effectively removing `fakeMapPlayers`.
- Add the Scientist NPC to the `casa_do_treinador` map with movement and dialogue logic.
- Ensure the spawn loop strictly respects the `rate: 0` for the house map.

## Verification Plan

### Automated Tests
- Build check: `bun run build` to ensure no import errors.

### Manual Verification
- Enter the Trainer's House and verify the new Scientist NPC is present and moving.
- Confirm no Pokémon spawn in the house.
- Confirm no "fake" players appear on the map.
