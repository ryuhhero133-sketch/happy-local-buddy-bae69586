# Small Floating Craft HUD Plan

Add a new "CRAFT" button that opens a standalone, small, draggable, and minimizable pixel-art crafting HUD. This feature is isolated to avoid touching any existing systems (Mochila, Coleção, Forja, etc.).

## Proposed Changes

### 1. Window System Preservation
- Ensure the `WindowManager` and `GameWindow` components (created in the previous turn) are used only for the NEW Craft HUD.
- DO NOT convert existing tabs (Forja, Mochila) to this system yet, as per the "LEAVE THEM ALONE" rule.

### 2. New Craft HUD Component (`src/components/CraftHUD.tsx`)
- Create a compact crafting interface inspired by the reference image.
- **UI Elements**: 
  - Small draggable header with Title, Minimize (-), and Close (X) buttons.
  - 3 Input Slots for materials (reading from existing `idle.items`).
  - 1 Result Slot.
  - A "CRIAR" (Create) button.
- **Visuals**: Dark brown frames, pixel-art style, compact dimensions.

### 3. HUD Integration (`src/routes/idle.tsx`)
- Add a new "CRAFT" button to the existing HUD sidebar.
- Use `openWindow` from `WindowManager` to trigger the new `CraftHUD` component.
- Ensure the button is styled to match the existing RPG buttons but remains distinct.

## Technical Details
- Use the existing `WindowManager` context for handling the window state (open, drag, minimize).
- The `CraftHUD` will receive `idle.items` as props to display available resources in its slots.
- Dragging logic is already handled by `GameWindow.tsx`.

## Safety Verification
- Verify `Mochila`, `Coleção`, `Forja`, and `Melhorias` tabs still function as original inline tabs.
- Verify the new `CRAFT` button only affects its own floating panel.
- Verify the window is draggable and does not reset player data when closed.

