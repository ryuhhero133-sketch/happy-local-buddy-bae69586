## Modular Game HUD System

We will implement a reusable `GameWindow` component and a `WindowManager` state to handle floating, draggable panels. The first implementation will be a "FORGE" mini-inventory for Elemental Stones.

### Technical Details

- **State Management**: Add `forgeWindowOpen`, `forgePos`, and `forgeMinimized` to `src/routes/idle.tsx`.
- **Component**: Create a `GameWindow` functional component within `src/routes/idle.tsx` that uses `framer-motion` (or standard React state) for dragging.
- **Trigger**: Add an "ABRIR FORJA" button in the `mochila` (Backpack) tab or a dedicated HUD icon.
- **Content**: The Forge window will display `idle.items` filtered for `stone_` prefixes, showing icons, counts, and a compact RPG layout.
- **Safety**: No changes to existing Supabase schemas or backpack logic. This is a purely visual/additive overlay.
