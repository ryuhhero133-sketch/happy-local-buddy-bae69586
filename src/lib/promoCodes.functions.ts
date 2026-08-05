import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const validatePromoCode = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ code: z.string(), userId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { code, userId } = data;
    
    const codes = {
      "EGGVIP60K": { eggs: 3, crystals: 20000, balls: 50, vipDays: 60 },
      "BLACKPLUS30K": { eggs: 2, crystals: 30000, balls: 100, vipDays: 30 },
      "CHARIZMITIC30K": { charizardEgg: 1, crystals: 30000 }
    };

    const reward = codes[code as keyof typeof codes];
    if (!reward) return { success: false, message: "Código inválido" };

    // Aqui entraria a lógica de salvar no banco via supabaseAdmin
    return { success: true, reward };
  });
