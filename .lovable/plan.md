# Security Enhancement Plan

Improve server-side authority and client-side protection to prevent hacking and concurrent sessions.

## 1. Concurrent Session Protection
- Update `profiles` table (via server function) to store an `active_session_token`.
- When a user logs in, generate and save a new token.
- In `AuthGate.tsx`, periodically check if the local token matches the database token. If not, logout and show "Kicked" message.

## 2. Server-Side Authority Hardening
- **Deprecate `syncClientState`**: This function is a security risk as it allows the client to push state updates to the server. 
- **Move all logic to Server Functions**:
    - Ensure `gold`, `crystal`, and `level` are *never* updated directly from the client.
    - Resources must only change as a result of a validated server function (e.g., `reportKill`, `openChest`, `buyItem`).
- **Input Validation**: Add stricter Zod schemas and server-side checks for resource availability before purchases.

## 3. Client-Side Anti-Cheat
- **DevTools Discouragement**: Add a script to detect F12 / DevTools opening and clear the console or debugger-loop to slow down hackers.
- **Context Menu / Key Blocking**: Disable right-click and common shortcut keys (F12, Ctrl+Shift+I).

## 4. Database Integrity
- Ensure `profiles` and `trainer_state` tables have RLS policies that prevent users from writing to their own `gold` or `level` columns directly via the client SDK.

## Technical Details
- Use `crypto.randomUUID()` for session tokens.
- Add `checkActiveSession` server function.
- Update `AuthGate.tsx` to handle the kick logic.
- Update `src/lib/game.functions.server.ts` to remove/restrict `syncClientState_handler`.
