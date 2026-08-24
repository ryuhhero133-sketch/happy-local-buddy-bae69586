import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      {`FINAL SECURITY AUDIT — IDLE MON

HIGH LEVELS ARE LEGITIMATE, BUT MUST NEVER BE FORGED

Perform a final security audit of the IDLE MON project and Supabase database.

CRITICAL RULE

High levels are NOT inherently invalid.

A legitimate trainer or Pokémon may reach extremely high levels through normal gameplay.

The security problem is NOT the level itself.

The security problem is:

A player manipulating the frontend/browser/database request
and making the server believe that an impossible or unearned
trainer/Pokémon progression is legitimate.



Therefore:

LEGITIMATE HIGH LEVEL = ALLOWED
FORGED/MANIPULATED HIGH LEVEL = REJECTED



Do NOT create arbitrary maximum-level caps just to solve the exploit.

1. VERIFY THE COMPLETE AUTHORITY MODEL

Audit the entire project and confirm:

Frontend
LocalStorage
React State
DevTools
Browser Console
Client-side calculations
Direct Supabase requests

= UNTRUSTED



The authoritative state must come from:

Supabase/PostgreSQL
Server-side functions/RPCs
Validated database transactions



The client may REQUEST an action.

The client must NOT decide the final result.

2. TRAINER LEVEL

Audit:

trainer_level
trainer_xp
craft_points



A trainer can legitimately reach a very high level.

Therefore DO NOT simply add something like:

CHECK (trainer_level <= 100)



unless that is an actual game rule.

Instead, verify that trainer progression is derived from legitimate server-side actions.

For example:

battle completed
mission completed
reward legitimately granted
XP legitimately earned



The server/database must calculate:

XP gained
new XP
level progression



The client must never be able to submit:

trainer_level = 10000
trainer_xp = 999999999



and have that become authoritative merely because the value is technically inside a numeric range.

3. POKÉMON LEVEL

A Pokémon can legitimately reach a very high level.

Do NOT create an arbitrary security cap unless it is part of the actual game rules.

Instead, protect the progression chain:

Pokemon ownership
        ↓
legitimate XP
        ↓
legitimate progression
        ↓
legitimate level



The player must NOT be able to directly write:

pokemon.level
pokemon.xp
pokemon.stats
pokemon.rarity



through a normal client request.

A manipulated Pokémon must never become authoritative simply because the player owns the account.

4. MOST IMPORTANT — BANK VALIDATION

Audit the Pokémon BANK system.

The Bank must NEVER trust only:

pokemon.level
pokemon.owner_id



from the client.

Before allowing a Pokémon to enter the Bank, the server/database must verify:

The Pokémon actually belongs to the authenticated player
AND
the Pokémon exists in authoritative storage
AND
the Pokémon progression is valid
AND
the Pokémon has not been duplicated
AND
the Pokémon has not been illegally modified
AND
the Pokémon is eligible for Bank storage



The client must not be able to create a fake Pokémon object and submit it to the Bank.

The Bank must use authoritative database records.

5. RANKED MUST HAVE ITS OWN SECURITY GATE

This is CRITICAL.

A player must NOT be able to take a manipulated trainer/Pokémon and use it in Ranked.

Before entering Ranked, validate server-side:

trainer identity
trainer progression
Pokémon ownership
Pokémon identity
Pokémon progression
Pokémon stats
Pokémon eligibility
season rules
ranked eligibility
ban/restriction status



Do NOT trust values coming from:

React state
LocalStorage
URL parameters
request body
client JSON



If the player sends:

{
  "pokemonLevel": 999999,
  "attack": 999999999
}



the Ranked system must ignore/reject those client values and load the authoritative Pokémon state from the database.

6. FORBIDDEN STATE MUST NOT ENTER RANKED

If a player/Pokémon is detected as:

tampered
invalid
duplicated
inconsistent
unauthorized
banned/restricted



the server must reject the Ranked action.

Do NOT merely hide the Ranked button.

The actual Ranked RPC/server-side function must enforce the restriction.

7. BANK ≠ VALIDATION BYPASS

Do NOT assume:

"If the Pokémon is in the Bank, it must be legitimate."



The Bank must not become a place where manipulated client data is converted into trusted authoritative data.

When storing a Pokémon:

client → request
server → identify authoritative Pokémon
server → validate ownership/state
server → validate eligibility
server → transaction
database → authoritative Bank state



8. GAME_SAVES

Audit game_saves carefully.

The client may have a local representation such as:

{
  "trainerLevel": 10000,
  "pokemonLevel": 9999,
  "gold": 999999999
}



This MUST NOT automatically become authoritative.

If game_saves contains both:

UI/cache state



and:

authoritative progression/economy



separate those responsibilities.

Do not delete existing saves.

Do not reset legitimate player progress.

Do not create an arbitrary level cap just because the save contains a high level.

Instead, ensure authoritative progression cannot be forged.

9. DIRECT SUPABASE EXPLOIT

Test as a normal authenticated player.

Attempt to directly modify:

trainer_level
trainer_xp
gold
crystal
ruby
craft_points
pokemon.level
pokemon.xp
pokemon.stats
ranked_score
inventory.quantity



Use manipulated values such as:

10000
999999
999999999



The database must reject unauthorized authoritative changes.

10. TEST HIGH LEVEL LEGITIMATE STATE

This is equally important.

Do NOT only test that high levels are rejected.

Create/use a legitimate high-level trainer and legitimate high-level Pokémon.

Verify that they can still:

use the Bank
participate in legitimate systems
progress normally
use eligible features



The security system must distinguish:

HIGH LEVEL + LEGITIMATE PROGRESSION
=
VALID

HIGH LEVEL + FORGED/MANIPULATED PROGRESSION
=
INVALID



11. TEST THE ATTACK CHAIN

Simulate this exact exploit scenario:

1. Player modifies React state.
2. Player modifies LocalStorage.
3. Player modifies the browser request.
4. Player attempts to submit an extremely high trainer level.
5. Player attempts to submit an extremely high Pokémon level.
6. Player attempts to save the manipulated state.
7. Player attempts to put the manipulated Pokémon into the Bank.
8. Player attempts to use the manipulated Pokémon/trainer in Ranked.
9. Player attempts to receive Ranked rewards.



Every unauthorized step must be rejected at the server/database boundary.

The attacker must NOT be able to turn client manipulation into authoritative progression.

12. RLS SECURITY

Review all RLS policies.

Especially check whether policies currently allow:

auth.uid() = user_id



while still allowing the player to modify sensitive fields.

Ownership policies alone are insufficient.

Sensitive progression/economy fields must be protected by:

RLS
RPC authorization
database validation
server-side calculations



Remove unsafe:

USING (true)
WITH CHECK (true)



policies.

13. RPC SECURITY

Audit every RPC used by:

Bank
Ranked
Pokémon progression
Trainer progression
Rewards
Inventory
Market
Eggs
Purchases
Transfers



The client must never be able to pass the final authoritative result as a trusted parameter.

Bad:

update_pokemon(level, xp, stats)



Better:

gain_pokemon_xp(pokemon_id, action_id)



The server determines the result.

Also verify that RPCs cannot be abused through:

negative values
huge values
foreign IDs
another player's IDs
replayed requests
simultaneous requests
modified parameters



14. DUPLICATION / REPLAY

Test:

double-click
multiple browser tabs
simultaneous requests
repeated RPC calls
replayed requests
refresh during transaction



A legitimate action must produce the intended result exactly once.

Rewards, purchases, Bank transfers and Ranked rewards must be idempotent where appropriate.

15. DO NOT BREAK LEGITIMATE GAMEPLAY

After security changes, verify:

Login
Load save
Save game
Trainer progression
High-level trainers
High-level Pokémon
Bank
Ranked
XP
Gold
Crystal
Ruby
Inventory
Rewards
Eggs
Market
Purchases



still work correctly for legitimate players.

16. FINAL VERIFICATION REPORT

Do not simply say:

"Security implemented."



Provide evidence.

Report:

A. Vulnerabilities found

List the actual vulnerabilities discovered.

B. Files changed

List exact files modified.

C. Database tables changed

List exact tables.

D. RLS policies

List policies created, removed or modified.

E. RPCs/functions

List all secure RPCs created or modified.

F. Bank security

Explain exactly how the Bank verifies authoritative Pokémon data.

G. Ranked security

Explain exactly how Ranked verifies trainer/Pokémon eligibility.

H. High-level validation

Confirm that legitimate high-level trainers/Pokémon remain valid.

I. Exploit tests

For each test report:

Attack
Expected result
Actual result
PASS / FAIL



At minimum test:

trainer_level manipulation
trainer_xp manipulation
gold manipulation
crystal manipulation
ruby manipulation
pokemon.level manipulation
pokemon.xp manipulation
pokemon.stats manipulation
ranked_score manipulation
inventory duplication
reward duplication
Bank injection
Ranked injection
another player's data
RPC parameter manipulation
replay attack
simultaneous requests
game_saves manipulation



J. Remaining vulnerabilities

Explicitly list anything that remains exploitable or cannot currently be verified.

FINAL SECURITY DECISION

You may only return:

APPROVED FOR PRODUCTION

if:

Direct manipulation was actually tested.

The database rejected unauthorized manipulation.

A manipulated Pokémon cannot bypass Bank validation.

A manipulated trainer/Pokémon cannot bypass Ranked validation.

Legitimate high-level trainers/Pokémon still work.

No critical exploit remains.

If any of these conditions are not satisfied, return:

NOT APPROVED — SECURITY GAPS REMAIN

Do not claim the game is secure without actually performing the tests.`}
    </div>
  ),
})
