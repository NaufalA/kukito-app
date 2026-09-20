import { log } from 'console';
import { Ingredient, Equipment, Recipe, GeminiModel, geminiRecipeSchema } from '../types';
import { ListGeminiModelsResponse } from '../types/dtos';
import { GoogleGenAI } from '@google/genai';
import * as z from "zod";

let ai: GoogleGenAI;

export function initiateGemini(apiKey: string): void {
  ai = new GoogleGenAI({ apiKey });
}

export async function listGeminiModels(apiKey: string): Promise<GeminiModel[]> {
  const pageSize = 100;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=${pageSize}`
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Gemini API returned ${response.status}`);
  }

  const data: ListGeminiModelsResponse = await response.json();

  return data.models.filter((model) => (
    model.name.includes('gemini-3.')
    && !model.name.includes('image')
    && !model.name.includes('preview')
    && model.supportedGenerationMethods.includes('generateContent')
  ));
}

export async function generateRecipeWithGemini(
  prompt: string,
  ingredients: Ingredient[],
  equipment: Equipment[],
  modelName: string = 'gemini-3.5-flash'
): Promise<{ text: string; recipe?: Recipe }> {
  const activeIngredients = ingredients
    .filter((i) => i.quantity > 0)
    .map((i) => `${i.name} (${i.quantity} ${i.unit} in ${i.location})`)
    .join(', ');

  const availableEquipment = equipment
    .filter((e) => e.isAvailable)
    .map((e) => e.name)
    .join(', ');

  const systemInstruction =
    "You are Kukito! 🤌, an expert, encouraging home chef and kitchen companion.\n" +
    "User's Current In-Stock Ingredients: " + (activeIngredients || 'None listed') + "\n" +
    "User's Available Kitchen Equipment: " + (availableEquipment || 'Basic stove and cookware') + "\n\n" +
    "CRITICAL INSTRUCTIONS:\n" +
    "1. Create a delicious, tailored recipe that prioritizes the user's available ingredients and equipment.\n" +
    "Make sure:\n" +
    "1. ingredient names match the user's inventory names wherever possible so our app can automatically deduct them.\n" +
    "2. steps ingredient names exist in ingredients array.";

  const interaction = await ai.interactions.create({
    model: modelName,
    system_instruction: systemInstruction,
    input: prompt,
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: geminiRecipeSchema,
    },
    stream: true,
  });

  let outputText = '';
  for await (const event of interaction) {
    switch (event.event_type) {
      case 'step.delta':
        if (event.delta?.type === 'text' && event.delta.text) {
          outputText += event.delta.text;
        }
        break;
      case 'error':
        const errMessage = `Gemini API Error: ${event.error}`;
        console.error(errMessage);
        return {
          text: errMessage,
          recipe: undefined,
        }
      case 'interaction.completed':
        console.debug(`Gemini API Completed`, event.interaction);
        break;
      default:
        console.debug(`Gemini API ${event.event_type}`, event);
        break;
    }
  }

  if (!outputText) {
    const errMessage = 'Gemini returned no response'
    console.error("Gemini API error: ", errMessage);
    return {
      text: `Gemini API error: ${errMessage}. Please try again.`,
    }
  }

  const recipeSchema = z.fromJSONSchema(geminiRecipeSchema);

  try {
    const parsedRecipe = recipeSchema.parse(JSON.parse(outputText)) as Recipe;
    parsedRecipe.id = `ai-${Date.now().toString()}`;
    parsedRecipe.isAiGenerated = true;
    return {
      text: 'Here is a custom recipe tailored to your kitchen! 🤌',
      recipe: parsedRecipe,
    }
  } catch (error) {
    console.error("Gemini response parsing error: ", error);
    console.debug("Gemini response: ", outputText);
    return {
      text: `Hmm, I had some trouble parsing that recipe: ${error}. Please try again.`,
    }
  };
}
