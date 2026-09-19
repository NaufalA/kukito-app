import { Ingredient, Equipment, Recipe, GeminiModel } from '../types';
import { ListGeminiModelsResponse } from '../types/dtos';

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
  apiKey: string,
  modelName: string = 'gemini-3.5-flash'
): Promise<{ text: string; recipe?: Recipe }> {
  // If user provided a live API key, call the official Google Gemini API
  if (apiKey && apiKey.trim().length > 10) {
    try {
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
        "2. If the user asks a recipe question, respond with friendly conversational chef advice followed by a strictly formatted JSON block wrapped in ```json ... ``` containing the recipe details:\n" +
        "{\n" +
        '  "title": "Recipe Title",\n' +
        '  "description": "Short appetizing description",\n' +
        '  "cuisine": "Cuisine type (e.g., Italian, Asian, Mexican)",\n' +
        '  "prepTimeMinutes": 10,\n' +
        '  "cookTimeMinutes": 20,\n' +
        '  "servings": 2,\n' +
        '  "difficulty": "Easy",\n' +
        '  "ingredients": [\n' +
        '    { "name": "Ingredient Name", "amount": 2, "unit": "pcs" }\n' +
        '  ],\n' +
        '  "equipment": ["Equipment 1", "Equipment 2"],\n' +
        '  "steps": ["Step 1...", "Step 2..."],\n' +
        '  "tips": ["Chef tip..."]\n' +
        "}\n" +
        "Make sure ingredient names match the user's inventory names wherever possible so our app can automatically deduct them!";

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey.trim()}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nUser Request: ${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Gemini API returned ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

      // Extract JSON recipe if present
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
      let parsedRecipe: Recipe | undefined;

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          parsedRecipe = {
            id: 'ai-' + Date.now(),
            title: parsed.title || 'AI Chef Special',
            description: parsed.description || '',
            cuisine: parsed.cuisine || 'Home Cooking',
            prepTimeMinutes: Number(parsed.prepTimeMinutes) || 10,
            cookTimeMinutes: Number(parsed.cookTimeMinutes) || 15,
            servings: Number(parsed.servings) || 2,
            difficulty: parsed.difficulty || 'Easy',
            ingredients: (parsed.ingredients || []).map((ing: any) => ({
              name: String(ing.name),
              amount: Number(ing.amount) || 1,
              unit: String(ing.unit || ''),
            })),
            equipment: parsed.equipment || [],
            steps: parsed.steps || [],
            tips: parsed.tips || [],
            isAiGenerated: true,
          };
        } catch (e) {
          console.error('Failed to parse recipe JSON from Gemini response', e);
        }
      }

      // Clean display text by removing the raw JSON codeblock
      const displayText = rawText.replace(/```json[\s\S]*?```/, '').trim();

      return {
        text: displayText || 'Here is a custom recipe tailored to your kitchen! 🤌',
        recipe: parsedRecipe,
      };
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to smart engine:', err.message);
      return generateFallbackRecipe(prompt, ingredients, equipment, err.message);
    }
  }

  // Fallback offline generator if no key is provided
  return generateFallbackRecipe(prompt, ingredients, equipment);
}

function generateFallbackRecipe(
  prompt: string,
  ingredients: Ingredient[],
  equipment: Equipment[],
  apiError?: string
): { text: string; recipe?: Recipe } {
  const hasEggs = ingredients.some((i) => i.name.toLowerCase().includes('egg') && i.quantity > 0);
  const hasRice = ingredients.some((i) => i.name.toLowerCase().includes('rice') && i.quantity > 0);
  const hasChicken = ingredients.some((i) => i.name.toLowerCase().includes('chicken') && i.quantity > 0);
  const hasGarlic = ingredients.some((i) => i.name.toLowerCase().includes('garlic') && i.quantity > 0);

  let fallbackRecipe: Recipe;

  if (hasChicken && hasGarlic) {
    fallbackRecipe = {
      id: 'ai-' + Date.now(),
      title: 'Golden Garlic Sautéed Chicken',
      description: 'A savory, golden skillet chicken packed with aromatic garlic and pan-seared richness.',
      cuisine: 'Home Bistro',
      prepTimeMinutes: 10,
      cookTimeMinutes: 12,
      servings: 2,
      difficulty: 'Easy',
      ingredients: [
        { name: 'Chicken Breast', amount: 300, unit: 'g' },
        { name: 'Garlic', amount: 3, unit: 'cloves' },
        { name: 'Olive Oil', amount: 15, unit: 'ml' },
        { name: 'Black Pepper', amount: 2, unit: 'g' },
        { name: 'Salt', amount: 3, unit: 'g' },
      ],
      equipment: ['Non-stick Frying Pan', "Chef's Knife", 'Cutting Board'],
      steps: [
        'Slice the chicken breast into even cutlets and season generously with salt and pepper.',
        'Mince the garlic finely.',
        'Heat olive oil in your skillet over medium heat. Sauté minced garlic for 30 seconds until golden.',
        'Add chicken cutlets and sear undisturbed for 4-5 minutes per side until deep golden and cooked through (internal 75°C / 165°F).',
        'Rest for 3 minutes, then slice diagonally. Drizzle with pan juices and enjoy!',
      ],
      tips: ['Never overcrowd the pan so the chicken sears rather than steams.'],
      isAiGenerated: true,
    };
  } else if (hasEggs && hasRice) {
    fallbackRecipe = {
      id: 'ai-' + Date.now(),
      title: 'Classic Golden Egg Fried Rice',
      description: 'Fluffy wok-style fried rice infused with scrambled eggs and savory aromatics.',
      cuisine: 'East Asian',
      prepTimeMinutes: 5,
      cookTimeMinutes: 8,
      servings: 2,
      difficulty: 'Easy',
      ingredients: [
        { name: 'White Rice', amount: 250, unit: 'g' },
        { name: 'Eggs', amount: 2, unit: 'pcs' },
        { name: 'Garlic', amount: 2, unit: 'cloves' },
        { name: 'Soy Sauce', amount: 15, unit: 'ml' },
        { name: 'Olive Oil', amount: 15, unit: 'ml' },
      ],
      equipment: ['Non-stick Frying Pan', "Chef's Knife"],
      steps: [
        'Whisk the eggs in a small bowl with a pinch of salt.',
        'Heat 1 tbsp oil in a hot pan, pour in eggs and scramble gently until 80% set, then set aside.',
        'Add remaining oil to pan, sauté garlic for 30 seconds until fragrant.',
        'Add cooked rice, breaking up clumps with a spatula over high heat.',
        'Drizzle soy sauce around the rim of the pan so it caramelizes into the rice.',
        'Fold in the scrambled eggs, toss thoroughly for 1 minute, and serve steaming hot!',
      ],
      tips: ['Day-old refrigerated rice yields the crispiest, non-mushy texture.'],
      isAiGenerated: true,
    };
  } else {
    fallbackRecipe = {
      id: 'ai-' + Date.now(),
      title: 'Quick Chef Medley Skillet',
      description: 'A comforting, customizable pan-tossed meal using your staple ingredients.',
      cuisine: 'Pantry Comfort',
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      servings: 1,
      difficulty: 'Easy',
      ingredients: [
        { name: 'Olive Oil', amount: 15, unit: 'ml' },
        { name: 'Garlic', amount: 2, unit: 'cloves' },
        { name: 'Eggs', amount: 2, unit: 'pcs' },
        { name: 'Salt', amount: 2, unit: 'g' },
      ],
      equipment: ['Non-stick Frying Pan'],
      steps: [
        'Warm olive oil in your pan over medium heat.',
        'Crack eggs into the pan and fry sunny-side or over-easy to your preference.',
        'Season with salt, freshly ground pepper, and serve alongside your favorite carbs!',
      ],
      tips: ['A lid over the skillet helps cook the egg whites perfectly without flipping.'],
      isAiGenerated: true,
    };
  }

  let note = "Here is a recipe I crafted based on your kitchen inventory! 🤌\n\n*(Tip: Add your Google Gemini API Key in Settings for unlimited live generative chat!)*";
  if (apiError) {
    note = `*(Note: Gemini API notice: ${apiError})*\n\nHere is a tailored recipe from your current inventory:`;
  }

  return {
    text: note,
    recipe: fallbackRecipe,
  };
}
