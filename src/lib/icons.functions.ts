import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const GenerationSchema = z.object({
  svg: z.string().describe("O código SVG completo da imagem"),
});

export const generateMapIcon = createServerFn({ method: "POST" })
  .input(z.object({
    type: z.string(),
    name: z.string(),
  }))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("Missing API Key");

    const provider = createLovableAiGatewayProvider(LOVABLE_API_KEY);
    
    const { object } = await generateText({
      model: provider("gpt-4o"), // Or another appropriate model
      prompt: `Gere um ícone RPG em formato SVG para um local chamado "${data.name}" do tipo "${data.type}".
      O estilo deve ser pixel-art profissional, com profundidade, cores vibrantes e brilho mágico/RPG.
      Não use emojis. Crie formas geométricas e caminhos que representem o local (ex: chamas para vulcão, cristais para caverna).
      O SVG deve ser quadrado, idealmente 64x64, mas escalável.
      Retorne APENAS o código SVG.`,
      // Note: In a real implementation with structured output support, we'd use experimental_output: object
    });

    // Extract SVG from text if needed, for simplicity returning as is
    const svgMatch = object.match(/<svg[\s\S]*<\/svg>/);
    return { svg: svgMatch ? svgMatch[0] : null };
  });
