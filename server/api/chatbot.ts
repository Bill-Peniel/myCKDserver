import { Router } from "express";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { asyncHandler, HttpError } from "../utils";
import { parseBody } from "../services";

const router = Router();

const SYSTEM_INSTRUCTION =
  "Vous êtes un assistant médical spécialisé dans la néphrologie et les maladies rénales chroniques. " +
  "Vous aidez des médecins. Répondez en français, de manière professionnelle et précise.";

const messageSchema = z.object({
  message: z.string().trim().min(1, "Message vide").max(4000, "Message trop long"),
});

router.post("/", asyncHandler(async (req, res) => {
  const { message } = parseBody(messageSchema, req.body);

  if (!process.env.GEMINI_API_KEY) {
    throw new HttpError(503, "Assistant indisponible : GEMINI_API_KEY non configurée");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  });

  try {
    const result = await model.generateContent(message);
    res.json({ message: result.response.text() });
  } catch (error) {
    console.error("Erreur Gemini:", error);
    throw new HttpError(502, "Erreur lors de la communication avec l'assistant");
  }
}));

export default router;
