# Plan - Overhaul Forge System

Implement persistence and new "Orbiting" interaction for the Forge floating window system.

## User Requirements
- The Forge must persist its position and state (open/minimized) across page reloads.
- The Forge must open correctly when clicked.
- Clicking the Forge should reveal secondary "Orbiting" icons (e.g., Crafting) around it.
- UI Style: RPG/MMO theme with a light beige inventory and specific Elemental Stone icons.

## Technical Details
- **Persistence**: Use `localStorage` to save/load `forgePos`, `forgeMinimized`, and `forgeWindowOpen` states.
- **Interaction Logic**: Refine the drag-vs-click detection to ensure the window opens correctly.
- **Orbiting UI**: Add a set of secondary action buttons (icons) that appear in a circular pattern around the minimized Forge chest when a toggle/long-press is active or as a context menu.
- **Styling**: Enhance the "Golden Chest" floating orb and the beige inventory window.

## Proposed Changes

### `src/routes/idle.tsx`
- Update state initialization for `forgePos`, `forgeMinimized`, and `forgeWindowOpen` to load from `localStorage`.
- Add `useEffect` hooks to save these states to `localStorage` whenever they change.
- Implement `isForgeActionsOpen` state for the orbiting icons.
- Add a circular layout for "Craft" and "Enhance" icons around the minimized chest.
- Fix click handlers to ensure `setForgeWindowOpen(true)` and `setForgeMinimized(false)` work reliably.
