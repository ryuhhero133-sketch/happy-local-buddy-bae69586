---
title: Trainer Equipment & Skin System
description: Implement a pixel-art style equipment and skin selection interface in the "Início" tab, inspired by the provided reference image.
participants:
  - Ryuhhero
---

## Overview

The "Início" tab will be upgraded to include a dedicated "Equipment & Skins" section. This UI will feature a central trainer preview surrounded by equipment slots (Head, Chest, Weapon, Boots, Necklace, Ring) and a skin selection grid, following a pixel-art aesthetic.

## Technical Details

- **Component:** `src/routes/idle.tsx`
- **State Management:**
  - `equipment`: A new state object to track equipped items in each slot.
  - `equippedSkin`: Existing `skinId` state will be integrated into the new UI.
- **Visuals:**
  - Implement a pixelated "Equipment" panel with a central 120x120px character frame.
  - Add 6 equipment slots with placeholder icons (SVG or Lucide) when empty.
  - Use golden/brown borders and a dark purple background consistent with the reference image.
  - Redesign the skin selection list into a more compact, thematic grid below or beside the equipment panel.
- **Interactions:**
  - Clicking an equipment slot will open a mini-inventory filter to show compatible items.
  - Equipping an item will update the trainer's visual (if sprites are available) or just the slot icon.

## Implementation Steps

1.  **Define Equipment Types:** Add `EquipmentSlot` and `EquipmentItem` types to `game/systems.ts` or local to the component.
2.  **Redesign "Início" Tab:** Replace the current simple list/grid with a structured "Trainer Profile" layout.
3.  **Add Equipment Panel:**
    - Create a `TrainerEquipmentPanel` sub-component or section.
    - Render the central trainer avatar using the current `skinId`.
    - Render the 6 slots (Head, Body, Weapon, Feet, Accessory 1, Accessory 2).
4.  **Integrate Skins:** Move the skin selection logic into this new layout, making it feel like a "Wardrobe" feature.
5.  **Styling:** Use Tailwind CSS for the layout and custom inline styles for the pixel-art borders/backgrounds to match the `idle.tsx` aesthetic.
