# Modular RPG HUD and Forja Improvement

Refactor the Forja (Craft) system into a more professional, beige/brown RPG-style modular window, remove the redundant button under "FORJA", and enhance the Craft window content to include a mini-inventory view of stones and fragments.

## User Review Required

> [!IMPORTANT]
> - The buttons in the left sidebar will be cleaned up.
> - The "FORJA" window will change color from the current dark theme to a "beige/brown" RPG style.
> - A stone inventory will be added directly inside the Forja window.

## Proposed Changes

### HUD Cleanup
- Remove the redundant button located directly under the main "FORJA" button in the sidebar.
- Ensure the sidebar trigger only opens the modular `GameWindow`.

### Craft System Enhancement
- Modify `src/components/CraftWindowContent.tsx`:
    - Update the UI to a "beige/brown" palette.
    - Add a "Stones Inventory" section showing quantities of `stone_fire`, `stone_grass`, `stone_water`, `stone_electric`, `stone_dark`, `stone_dragon` and their fragments.
    - Improve the recipe layout for better readability.

### Modular Window Styling
- Update `src/components/GameWindow.tsx` (or pass props) to support the "Beige/Brown" theme requested for the Forja.

## Technical Details
- **WindowManager Integration**: Use the existing `WindowManager` to handle the Forja window.
- **Styling**: Use Tailwind classes for the new beige (`bg-[#F5E6C8]`) and brown (`border-[#B8862A]`) theme.
- **Component Splitting**: Move detailed craft logic into `CraftWindowContent` to keep `idle.tsx` lean.
