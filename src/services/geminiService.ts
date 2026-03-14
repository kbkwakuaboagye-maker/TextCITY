import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-3.1-pro-preview";

export async function polishText(text: string, style: 'professional' | 'creative' | 'concise' = 'professional') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const instructions = {
    professional: "Transform the following text into professional, clear, and perfectly polished writing. Fix all grammatical errors, spelling mistakes, and punctuation issues. Enhance the vocabulary while maintaining a formal yet accessible tone. Do not change the core meaning, but make it read like it was written by a top-tier professional editor.",
    creative: "Transform the following text into engaging, vivid, and polished writing. Fix all errors and punctuation. Use expressive language and varied sentence structures to make the writing more compelling and artistic while preserving the original intent.",
    concise: "Transform the following text into the most concise and clear version possible. Remove fluff, fix all errors and punctuation, and ensure every word adds value. Make it punchy and direct."
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{ parts: [{ text: `${instructions[style]}\n\nText to polish:\n${text}` }] }],
    config: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
    }
  });

  return response.text || "Failed to generate polished text.";
}
