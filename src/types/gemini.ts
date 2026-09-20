import * as z from "zod";

export type GeminiModel = {
  name: string;
  version: string;
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
  temperature: number;
  topP: number;
  topK: number;
  maxTemperature: number;
  thinking: boolean;
}

export const geminiRecipeSchema: z.core.JSONSchema.JSONSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Recipe Title' },
    description: { type: 'string', description: 'Short appetizing description' },
    cuisine: { type: 'string', description: 'Cuisine type (e.g., Italian, Asian, Mexican)' },
    prepTimeMinutes: { type: 'number' },
    cookTimeMinutes: { type: 'number' },
    servings: { type: 'number' },
    difficulty: { type: 'string', description: 'Difficulty level (Easy, Medium, Hard)' },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          amount: { type: 'number' },
          unit: { type: 'string' },
        },
        required: ['name', 'amount', 'unit'],
      }
    },
    equipment: {
      type: 'array',
      items: { type: 'string' }
    },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          headline: { type: 'string' },
          description: { type: 'string' },
          ingredientNames: {
            type: 'array',
            items: {
              type: 'string',
              description: 'ingredient used in the step. if has a specific amount that does not use total amount in ingredients list, include it on the string separated by | symbol with abbreviated unit (example: salt|1 tsp)'
            }
          }
        },
        required: ['headline', 'description', 'ingredientNames'],
      }
    },
    tips: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: [
    'title',
    'description',
    'cuisine',
    'prepTimeMinutes',
    'cookTimeMinutes',
    'servings',
    'difficulty',
    'ingredients',
    'equipment',
    'steps',
    'tips'
  ],
}
