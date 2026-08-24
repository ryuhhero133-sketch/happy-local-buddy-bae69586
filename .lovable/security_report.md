# Security Audit: Vulnerabilities and Remediation Plan

## 1. Found Vulnerabilities

| File | Line | System | Client can alter? | Risk | Explanation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src/lib/game.functions.server.ts` | 17 | Core Sync | Yes | 🔴 **CRITICAL** | `syncClientState_handler` accepts `gold`, `crystal`, `level`, and `xp` from the client. Although it has a "clamp" logic, the logic was recently set to `gain = 0` but it still performs an `update` based on client-provided values. |
| `src/lib/game.functions.ts` | 406 | Bootstrap | Yes | 🔴 **CRITICAL** | `pushInitialState` accepts a full snapshot of gold, crystals, level, and collection from the client. It only guards against "existing progress", meaning a new account can start with maxed stats. |
| `src/components/PokemonMarketPanel.tsx` | 205+ | Market | Yes | 🟠 **HIGH** | The frontend directly calls `.update()` on `pokemon_market`. If RLS policies allow this, a user could manipulate prices, statuses, or claim payouts they aren't entitled to. |
| `src/lib/rankedApi.ts` | 251+ | Ranked | Yes | 🟠 **HIGH** | Directly uses `.upsert()` from the frontend to `ranked_scores` and `ranked_leaderboard`. This allows any player to set their own level and score in the rankings. |
| `src/routes/idle.tsx` | 3640 | Players | Yes | 🟠 **HIGH** | `upsert` to `players` table directly from the frontend. |
| `src/lib/game.functions.ts` | 201, 325, 332 | Server Fn | No | 🟢 **LOW** | These are inside `createServerFn`. They are secure as long as the inputs to these functions are validated (which they mostly are via Zod). |
| `src/routes/AuthGate.tsx` | 337 | Profiles | Yes | 🟡 **MEDIUM** | Direct `.update()` to `last_login`. Low risk but shows pattern of client-side write access. |

## 2. The Worst Breach
The worst breach is the **Client-Side Authority** in `syncClientState_handler` and `pushInitialState`. Any player can open the browser console and call these server functions (or directly the Supabase client) to set their `gold`, `crystal`, and `trainer_level` to the maximum allowed by the Zod schema (50M Gold, 1M Crystal, Level 10,000).

## 3. Immediate Blocking Plan (Phase 2)

### A. Database Migration (RLS Lockdown)
We will implement a migration to:
1.  **Revoke all `INSERT/UPDATE/DELETE` permissions** for the `authenticated` role on sensitive tables: `trainer_state`, `pokemon_collection`, `pokeballs`, `inventory`, `ranked_scores`, `kill_log`, `chest_claims`.
2.  Ensure only `service_role` (used by server functions) can write to these tables.
3.  Add `security_events` and `suspected_exploits` tables.

### B. Code Refactor
1.  **`src/lib/game.functions.server.ts`**: Completely ignore client-provided stats in `syncClientState_handler`. It should only be used for non-critical UI preferences or removed entirely in favor of server-calculated state.
2.  **`src/lib/game.functions.ts`**: Remove or strictly limit `pushInitialState`. New players should start with hardcoded base values defined on the server.
3.  **`src/lib/rankedApi.ts`**: Convert all ranked updates to `createServerFn` that pull data from `trainer_state` on the server instead of accepting parameters from the client.

## 4. Vulnerability Status

| System | Status |
| :--- | :--- |
| **Trainer Level/XP** | 🔴 **VULNERABLE** (via Sync/Push) |
| **Gold/Crystal** | 🔴 **VULNERABLE** (via Sync/Push) |
| **Pokémon Level/XP** | 🔴 **VULNERABLE** (via Sync) |
| **Ranked Score** | 🔴 **VULNERABLE** (via direct client upsert) |
| **Inventory/Items** | 🟠 **RISK** (via Sync) |

---
*I am now proceeding to generate the emergency migration and code fixes.*
