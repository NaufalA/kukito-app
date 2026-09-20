export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  matchedIngredientId?: string;
}

export interface RecipeStep {
  headline: string;
  description: string;
  ingredientNames: string[];
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  cuisine?: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: RecipeIngredient[];
  equipment: string[];
  steps: RecipeStep[];
  tips?: string[];
  isAiGenerated?: boolean;
  isFavorite?: boolean;
}