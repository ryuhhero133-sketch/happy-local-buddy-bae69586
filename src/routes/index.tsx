import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line', backgroundColor: '#fff0f0', border: '2px solid red' }}>
      {`🚨 IDLE MON — CRITICAL ANTI-EXPLOIT LOCKDOWN

A real exploit tool is being used against the game, including proxy/request manipulation, capture manipulation, spawn manipulation, automation and direct REST/RPC requests.

CORE RULE

The attacker completely controls the browser.

Frontend / React / LocalStorage / DevTools / Proxy / REST = UNTRUSTED
Supabase PostgreSQL + RLS + secure RPCs = AUTHORITY



Do NOT try to block F12, DevTools or the exploit program.

Make manipulated requests useless.

1. FIND THE VULNERABILITY

Audit ALL:

supabase.from()
.insert()
.update()
.upsert()
.delete()
.rpc()



Find every client write affecting:

trainer level/XP
Pokémon level/XP/stats/rarity/ownership
Gold/Crystal/Ruby
inventory
ranked
rewards
eggs
captures
spawns
Bank
Market
game_saves



Identify exactly where client data can become authoritative.

2. SERVER MUST CALCULATE EVERYTHING

The client can request an ACTION, but never send the final result.

Bad:

set_level(10000)
set_gold(999999999)
set_pokemon_level(999)
set_ranked_score(999999999)
capture(pokemon_json)



Good:

complete_battle(battle_id)
perform_capture(action_id)
claim_reward(reward_id)
deposit_pokemon(pokemon_id)
complete_ranked_match(match_id)



The server/database must calculate and validate the result.

3. PROTECT RLS + RPC

Normal players must NOT directly UPDATE/INSERT/DELETE authoritative values.

auth.uid() = user_id alone is NOT sufficient.

Remove unsafe policies such as:

USING (true)
WITH CHECK (true)



Review all RPCs and SECURITY DEFINER functions.

Prevent:

spoofed user IDs

manipulated parameters

replay

duplicate rewards

concurrent duplication

cross-player access

Use atomic transactions, constraints and idempotency where needed.

4. GAME_SAVES

This is critical.

A client JSON such as:

{
  "trainerLevel": 10000,
  "gold": 999999999,
  "pokemonLevel": 999999
}



must NEVER overwrite authoritative progression.

Do not delete or reset legitimate saves.

Separate client/cache data from authoritative progression.

If cloud loading fails, NEVER overwrite the valid save with default/client state.

5. CAPTURE + SPAWN

The client must NOT decide:

Pokémon
level
rarity
shiny
stats
spawn
capture success
reward



Server generates/validates these.

A fake capture or manipulated spawn request must be rejected.

6. BANK

Never trust Pokémon JSON sent by the client.

When depositing:

auth.uid()
→ load authoritative Pokémon
→ verify ownership/state
→ verify eligibility
→ atomic transaction
→ Bank



A forged Pokémon must NOT become legitimate by entering the Bank.

7. RANKED

Ranked must load authoritative trainer/Pokémon data from the database.

Never trust client:

level
XP
stats
score
rank
eligibility



A manipulated Pokémon/trainer must not bypass Ranked.

Legitimate high-level trainers and Pokémon MUST continue working.

Do NOT create arbitrary level caps as a security fix.

8. ECONOMY + INVENTORY

Protect:

Gold
Crystal
Ruby
Craft Points
Inventory
Rewards
Market



No direct client balance/quantity changes.

Prevent duplication, negative values, replay and concurrent exploits.

9. ATTACK TEST — MANDATORY

Using a normal authenticated player, test direct manipulation through:

DevTools
Console
Proxy
REST
RPC



Attempt:

trainer_level = 10000
trainer_xp = 999999999
gold = 999999999
crystal = 999999999
ruby = 999999999
pokemon.level = 999999
pokemon.xp = 999999999
pokemon.stats = arbitrary
ranked_score = 999999999
inventory.quantity = 999999
fake capture
fake spawn
fake Bank deposit
Ranked bypass
reward duplication
another player's data



Every unauthorized attempt must be rejected by the server/database.

FINAL REPORT

Return only:

Vulnerabilities found

Files changed

Tables/RLS changed

RPCs changed

Bank security

Ranked security

Game-save security

Attack test results: PASS/FAIL

Remaining vulnerabilities

Do NOT claim security without actually testing the database/API.

If every critical exploit is rejected:

APPROVED FOR PRODUCTION

Otherwise:

NOT APPROVED — SECURITY GAPS REMAIN`}
    </div>
  ),
})
