# World Map and Modular UI Improvements Plan

Improve the World Map with clearer progression indicators (red/green lines), grayscale logic for locked areas, and better iconography. Add the "MELHORIAS" (Improvements) and "MOCHILA" (Backpack) as modular windows to complete the new RPG HUD system.

## Proposed Changes

### 1. World Map Enhancements (src/routes/idle.tsx)
- **Visual Progression**: 
  - Pulsing green lines for unlocked paths (maps where trainer meets level requirements).
  - Dashed red lines for locked paths.
  - Apply grayscale(1) brightness(0.6) filter to map icons if level requirement is not met.
- **Connection Logic**: Ensure isPathUnlocked checks both source and target pin level requirements.
- **Icon Glows**: Intensify the "Obsidian/RPG" glow for unlocked maps.

### 2. New Modular Windows (src/components/)
- **Improvements Window (src/components/ImprovementsWindowContent.tsx)**:
  - Move "Anatomia da Conta" (Radar chart, upgrades for speed, attack, resistance) to a modular window.
  - Consumes Stones and Books.
- **Backpack Window (src/components/BackpackWindowContent.tsx)**:
  - Move the "MOCHILA" inventory UI to a modular window.
  - Keep the MMO/RPG layout with category filters (Balls, Potions, Books, etc.).

### 3. HUD Integration (src/routes/idle.tsx)
- Add "MELHORIAS" and "MOCHILA" buttons to the sidebar triggers.
- Configure openWindow to launch these new modular contents.
- Remove the old inline tab rendering for these sections to free up space and follow the new design pattern.

## Technical Details
- Use WindowManager context for state management.
- Modularize UI components into src/components/ to keep idle.tsx manageable.
- Maintain localStorage caching for AI-generated icons.
- Ensure all new windows follow the draggable pixel-art container style defined in GameWindow.tsx.

