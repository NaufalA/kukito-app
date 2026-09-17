export type IngredientCategory =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'pantry'
  | 'spices'
  | 'condiments'
  | 'frozen'
  | 'other';

export type StorageLocation = 'pantry' | 'fridge' | 'freezer';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  quantity: number;
  unit: string;
  location: StorageLocation;
  expiryDate?: string;
  lowStockThreshold?: number;
  notes?: string;
}

export type EquipmentCategory = 'cookware' | 'appliances' | 'prep' | 'baking' | 'other';

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  isAvailable: boolean;
  notes?: string;
}

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  matchedIngredientId?: string;
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
  steps: string[];
  tips?: string[];
  isAiGenerated?: boolean;
  isFavorite?: boolean;
}

export interface DeductionItem {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  recipeAmount: number;
  deductAmount: number; // Editable by user
  unit: string;
  isExcluded: boolean; // User toggle to skip
}

export interface DeductionRecord {
  id: string;
  recipeId: string;
  recipeTitle: string;
  timestamp: string;
  deductedItems: {
    ingredientId: string;
    ingredientName: string;
    amount: number;
    unit: string;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  generatedRecipe?: Recipe;
}

export interface UserSettings {
  geminiApiKey: string;
  geminiModel: string;
  hasCompletedOnboarding: boolean;
  theme: 'dark' | 'light';
}
