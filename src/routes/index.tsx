import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      {`🚨 CRITICAL SECURITY LOCKDOWN — IDLE MON

Players have been exploiting the game by modifying frontend state, localStorage, DevTools, or direct Supabase requests.

Previously, the database accepted manipulated values such as:

Trainer Level

Trainer XP

Gold

Crystal

Ruby / currencies

Pokémon Level

Pokémon XP and stats

Craft Points

Ranked score and progression

Inventory quantities

CORE RULE

The frontend must never be trusted.

Frontend / LocalStorage / React State = UNTRUSTED
Supabase Database + Server-side logic = SOURCE OF TRUTH



A player may change any value in their browser, but they must never be able to make the database accept that manipulated value.

YOUR TASK

Audit the entire project and implement a complete security lockdown.

1. Find all direct database writes

Search the entire project for:

supabase.from()
.insert()
.update()
.upsert()
.delete()
.rpc()



Identify every place where the client can send or modify:

level

XP

Gold

Crystal

Ruby

currencies

Pokémon data

inventory

Ranked

rewards

ownership

2. Lock down Supabase RLS and permissions

A normal authenticated player must NOT be able to directly INSERT, UPDATE, or DELETE sensitive game values.

Do not use insecure policies such as:

USING (true)
WITH CHECK (true)



Also remember:

auth.uid() = user_id



is NOT enough if the player can still update their own:

gold = 999999999
trainer_level = max
pokemon.level = max



The player must not be able to directly set sensitive values, even on their own account.

3. Make the server authoritative

The client must request an ACTION, not send the final result.

❌ NEVER allow:

set_gold(999999999)
set_trainer_level(10000)
set_pokemon_level(999)
set_ranked_score(999999999)



✅ Instead:

complete_battle(battle_id)
claim_reward(reward_id)
complete_mission(mission_id)
hatch_egg(egg_id)



The server/database must:

Identify the user with auth.uid()

Validate the action

Verify ownership and state

Prevent duplicate/replayed actions

Calculate XP, levels, Gold, Crystal, rewards, etc. server-side

Update the official database values atomically

4. Protect these systems completely

Make these values server-authoritative:

TRAINER
- level
- XP
- craft points

ECONOMY
- Gold
- Crystal
- Ruby
- all currencies/resources

POKÉMON
- level
- XP
- stats
- rarity
- ownership

RANKED
- score
- rank
- rewards

INVENTORY
- item quantities
- ownership

REWARDS / EGGS
- reward amount
- claimed state
- hatch results

MARKET
- price
- ownership
- purchases
- transfers

ADMIN
- roles
- gifts
- bans
- server configuration



5. Audit game_saves

This is critical.

If the client can send a full JSON save like:

{
  "trainerLevel": 10000,
  "gold": 999999999,
  "crystal": 999999999
}



the database must NOT blindly accept it.

Do not delete existing saves or player progress.

Keep the save system working, but separate untrusted client/cache data from authoritative progression and economic data.

6. Add database protection

Use the appropriate combination of:

RLS

REVOKE permissions

secure RPC functions

PostgreSQL validation

CHECK constraints

triggers where appropriate

atomic transactions

unique constraints/idempotency for rewards

The database must reject impossible or manipulated states.

7. Test the exploit

After the changes, test as a normal authenticated user.

Attempt direct manipulation of:

trainer_level = 10000
trainer_xp = 999999999
gold = 999999999
crystal = 999999999
pokemon.level = maximum/arbitrary
pokemon.xp = 999999999
pokemon.stats = arbitrary
ranked_score = 999999999
inventory.quantity = 999999



Also test:

repeated reward requests

simultaneous requests

duplicate purchases

modifying another player's data

calling RPCs directly with manipulated parameters

All exploit attempts must be rejected.

IMPORTANT

Do NOT break legitimate gameplay.

Normal players must still be able to:

login

load/save

gain XP

level up

earn Gold/Crystal

level up Pokémon

receive rewards

update Ranked

manage inventory

use eggs

buy/sell where applicable

But these changes must happen only through validated server-side logic.

FINAL REPORT

After implementation, provide:

Vulnerabilities found

Files and database tables changed

RLS/permission changes

Server-side RPCs/functions created or changed

Exploit test results

Any remaining vulnerabilities

Finish with exactly one:

APPROVED FOR PRODUCTION

or

NOT APPROVED — SECURITY GAPS REMAIN

Do not claim the game is secure without actually testing direct database manipulation as a normal authenticated player.`}
    </div>
  ),
})
