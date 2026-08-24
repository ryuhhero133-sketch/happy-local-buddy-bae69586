import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line', backgroundColor: '#f0fff0', border: '2px solid green' }}>
      {`ME INFORME
O problema é que o atacante consegue modificar os valores dos stats no JS/JSON client-side e depois enviar esses valores para a API.

Corrija definitivamente:

Nunca confie em valores críticos enviados pelo frontend.

Stats, level, XP, dano, HP, trainer level, recompensas, moedas e progressão devem ser calculados/validados server-side.

O cliente deve enviar apenas a ação/intenção, nunca o resultado.

Bloqueie UPDATE direto de campos protegidos via RLS.

Use RPCs/triggers/constraints para validar tudo no Supabase.

Mesmo modificando JS, DevTools, REST ou JSON, o jogador não pode alterar stats ou progressão.

Audite todos os endpoints e caminhos de escrita para encontrar bypasses.

Teste enviando valores manipulados diretamente para a API e confirme que o banco rejeita.

Regra principal: se o cliente puder modificar o valor, o servidor nunca deve confiar nele.`}

      {`🔴 POST-APPROVAL SECURITY VERIFICATION — IDLE MON




The previous security audit reported:




APPROVED FOR PRODUCTION




Do NOT repeat the previous audit.




Perform a final independent verification of the actual Supabase security boundary.




The purpose is to prove that the APPROVED status is backed by real database protections and real exploit tests.




1. VERIFY THE DATABASE, NOT THE UI




Inspect the actual Supabase database configuration.




Verify:




RLS status for every authoritative table




RLS policies




INSERT permissions




UPDATE permissions




DELETE permissions




SELECT permissions




RPC EXECUTE permissions




SECURITY DEFINER functions




triggers




constraints




foreign keys




unique constraints




relevant database functions




Do not infer security from frontend code.




2. VERIFY THESE AUTHORITATIVE SYSTEMS




Confirm that these cannot be directly manipulated by a normal authenticated player:




Trainer

- trainer_level

- trainer_xp

- craft_points




Economy

- gold

- crystal

- ruby

- resources




Pokémon

- ownership

- level

- XP

- stats

- rarity




Ranked

- score

- rank

- progression

- rewards




Inventory

- ownership

- quantity




Rewards

- reward amount

- claimed state




Eggs

- ownership

- hatch result

- hatch state




Market

- price

- ownership

- purchase

- transfer




Admin

- roles

- bans

- server configuration










3. DIRECT DATABASE ATTACK




Using a normal authenticated player session, attempt direct requests equivalent to:




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










Verify the database response.




Expected:




REJECTED










Do not accept frontend errors as proof.




The database must enforce the rejection.




4. BANK BYPASS TEST




Attempt to create or submit a manipulated Pokémon through the client and place it into the Bank.




Test:




fake level

fake XP

fake stats

fake rarity

fake ownership

another player's Pokémon ID

modified Pokémon JSON










Expected:




BANK REJECTS THE INVALID STATE










A manipulated Pokémon must never become authoritative simply because it was submitted to the Bank.




5. RANKED BYPASS TEST




Attempt to enter Ranked using manipulated client state.




Modify:




trainer level

Pokémon level

Pokémon XP

Pokémon stats

ranked score










Expected:




RANKED USES AUTHORITATIVE DATABASE STATE










Client-provided values must be ignored or rejected.




Do not rely on hiding the Ranked button.




6. LEGITIMATE HIGH-LEVEL TEST




Confirm the opposite case.




A legitimate trainer/Pokémon with a legitimately earned high level must still work.




Do NOT reject high levels simply because they are large.




The security rule is:




LEGITIMATE HIGH LEVEL = VALID




FORGED HIGH LEVEL = INVALID










7. GAME_SAVES TEST




Attempt to submit manipulated save JSON containing:




{

  "trainerLevel": 10000,

  "trainerXP": 999999999,

  "gold": 999999999,

  "crystal": 999999999

}










Verify that this cannot overwrite authoritative progression/economy.




Also verify:




cloud read failure

→ does NOT overwrite valid cloud data










Existing legitimate saves must remain intact.




8. RPC SECURITY




For every sensitive RPC, verify:




auth.uid() is used correctly




user IDs cannot be spoofed




another player's IDs are rejected




final authoritative values are not blindly accepted




negative values are rejected




impossible values are rejected




replay is handled




concurrent execution is safe




transactions are atomic




SECURITY DEFINER functions are hardened




search_path is safe




EXECUTE permissions are restricted




9. CROSS-PLAYER ATTACK




As a normal authenticated user, attempt to modify:




another player's trainer

another player's Pokémon

another player's inventory

another player's ranked score

another player's rewards

another player's game save










Expected:




ALL REJECTED










10. REPLAY / DUPLICATION TEST




Repeat:




reward claim

purchase

Bank transfer

Pokémon action

egg hatch

market transaction

Ranked reward










using:




double-click




multiple tabs




simultaneous requests




repeated RPC calls




replayed requests




Expected:




ONE VALID RESULT ONLY










No duplicated currency, Pokémon, items or rewards.




FINAL RESULT




Return evidence, not assumptions.




For every test provide:




TEST

ATTACK

EXPECTED RESULT

ACTUAL RESULT

DATABASE RESPONSE

PASS / FAIL










Also provide:




RLS VERIFIED: YES/NO

RPC SECURITY VERIFIED: YES/NO

DIRECT WRITE PROTECTION VERIFIED: YES/NO

BANK BYPASS VERIFIED: YES/NO

RANKED BYPASS VERIFIED: YES/NO

GAME_SAVE PROTECTION VERIFIED: YES/NO

CROSS-PLAYER PROTECTION VERIFIED: YES/NO

REPLAY PROTECTION VERIFIED: YES/NO

LEGITIMATE HIGH-LEVEL GAMEPLAY VERIFIED: YES/NO










IMPORTANT




Do NOT change the production status merely because the previous audit said APPROVED.




If the tests prove the protections are working:




APPROVED FOR PRODUCTION




If any critical exploit still works:




NOT APPROVED — SECURITY GAPS REMAIN




If a test cannot actually be performed, report:




NOT VERIFIED




Do not fabricate test results.`}
    </div>
  ),
})
