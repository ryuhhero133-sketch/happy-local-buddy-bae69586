# Plan: Trainer Equipment & Skin System

Implement a thematic "Equipment" panel in the **Início** tab, inspired by the provided reference image. This will centralize trainer customization, including equipment slots and skin selection.

## User Review Required

> [!IMPORTANT]
> - Which statistics should each equipment type (Head, Chest, etc.) improve? (e.g., Attack, Defense, HP, or Catch Rate).
> - Should equipment be obtainable via **Forge**, **Drops**, or **Shop**?

## Proposed Changes

### Game Systems & State
- Define `EquipmentSlot` types: `head`, `chest`, `weapon`, `boots`, `necklace`, `ring`.
- Add `equipment` to the local/cloud save state to persist equipped items.
- Define a base set of equipment items in `src/game/systems.tsx`.

### UI Components (`src/routes/idle.tsx`)
- **Trainer Equipment Panel**: 
    - A pixel-art styled container with a dark purple background and golden borders.
    - Central character preview (using the active `skinId`).
    - 6 equipment slots arranged around the trainer, mirroring the reference image.
    - Hover/Click interactions to show stats or change gear.
- **Skin Selector Integration**:
    - Relocate the existing skin selection grid into a "Wardrobe" sub-section of the Início tab.
    - Standardize the skin card visuals to match the new equipment panel style.

### Visual Design
- Use `rgba` overlays and pixel-perfect borders for the "Tempered Glass" effect seen in other UI elements.
- Placeholder icons for empty slots using thematic pixel-art silhouettes.

## Technical Details
- **File**: `src/routes/idle.tsx` (Primary UI logic).
- **File**: `src/game/systems.tsx` (Item definitions and types).
- **State**: `equippedItems: Record<EquipmentSlot, string | null>`.
- **Styling**: Tailwind CSS for grid layout + inline `style` for specific pixel-art decorative elements.
