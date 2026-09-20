import { Ingredient, Equipment, Recipe, DeductionRecord, ChatMessage, UserSettings } from '../types';

const STORAGE_KEYS = {
  INGREDIENTS: 'kukito_ingredients_v1',
  EQUIPMENT: 'kukito_equipment_v1',
  RECIPES: 'kukito_recipes_v1',
  CHAT: 'kukito_chat_v1',
  SETTINGS: 'kukito_settings_v1',
  DEDUCTION_HISTORY: 'kukito_deductions_v1',
};

export const ONBOARDING_STAPLES: Omit<Ingredient, 'id'>[] = [
  { name: 'Olive Oil', category: 'condiments', quantity: 500, unit: 'ml', location: 'pantry', lowStockThreshold: 100 },
  { name: 'Eggs', category: 'dairy', quantity: 12, unit: 'pcs', location: 'fridge', lowStockThreshold: 3 },
  { name: 'Garlic', category: 'produce', quantity: 1, unit: 'bulb', location: 'pantry', lowStockThreshold: 1 },
  { name: 'Onion', category: 'produce', quantity: 3, unit: 'pcs', location: 'pantry', lowStockThreshold: 1 },
  { name: 'Salt', category: 'spices', quantity: 500, unit: 'g', location: 'pantry', lowStockThreshold: 50 },
  { name: 'Black Pepper', category: 'spices', quantity: 50, unit: 'g', location: 'pantry', lowStockThreshold: 10 },
  { name: 'Soy Sauce', category: 'condiments', quantity: 250, unit: 'ml', location: 'pantry', lowStockThreshold: 50 },
  { name: 'White Rice', category: 'pantry', quantity: 1000, unit: 'g', location: 'pantry', lowStockThreshold: 200 },
  { name: 'Pasta', category: 'pantry', quantity: 500, unit: 'g', location: 'pantry', lowStockThreshold: 150 },
  { name: 'Butter', category: 'dairy', quantity: 200, unit: 'g', location: 'fridge', lowStockThreshold: 50 },
  { name: 'Chicken Breast', category: 'meat', quantity: 500, unit: 'g', location: 'fridge', lowStockThreshold: 200 },
  { name: 'Milk', category: 'dairy', quantity: 1000, unit: 'ml', location: 'fridge', lowStockThreshold: 200 },
];

export const ONBOARDING_EQUIPMENT: Omit<Equipment, 'id'>[] = [
  { name: 'Non-stick Frying Pan', category: 'cookware', isAvailable: true },
  { name: 'Saucepan / Pot', category: 'cookware', isAvailable: true },
  { name: "Chef's Knife", category: 'prep', isAvailable: true },
  { name: 'Cutting Board', category: 'prep', isAvailable: true },
  { name: 'Tablespoon', category: 'measuring', measurement: [{ amount: 1, unit: 'tablespoon' }, { amount: 1, unit: 'tbsp' }, { amount: 15, unit: 'ml' }], isAvailable: true },
  { name: 'Teaspoon', category: 'measuring', measurement: [{ amount: 1, unit: 'teaspoon' }, { amount: 1, unit: 'tsp' }, { amount: 5, unit: 'ml' }], isAvailable: true },
  { name: 'Air Fryer', category: 'appliances', isAvailable: true },
  { name: 'Rice Cooker', category: 'appliances', isAvailable: true },
  { name: 'Oven', category: 'baking', isAvailable: true },
  { name: 'Blender', category: 'appliances', isAvailable: false },
  { name: 'Microwave', category: 'appliances', isAvailable: true },
];

export const storageService = {
  getIngredients(): Ingredient[] {
    const raw = localStorage.getItem(STORAGE_KEYS.INGREDIENTS);
    return raw ? JSON.parse(raw) : [];
  },

  setIngredients(items: Ingredient[]): void {
    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(items));
  },

  getEquipment(): Equipment[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EQUIPMENT);
    return raw ? JSON.parse(raw) : [];
  },

  setEquipment(items: Equipment[]): void {
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(items));
  },

  getRecipes(): Recipe[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RECIPES);
    return raw ? JSON.parse(raw) : [];
  },

  setRecipes(recipes: Recipe[]): void {
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
  },

  getChatHistory(): ChatMessage[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT);
    if (!raw) {
      return [
        {
          id: 'welcome-msg',
          sender: 'assistant',
          text: "Ciao! I'm your Kukito! 🤌 culinary assistant. I know exactly what's in your kitchen. Ask me what to cook, or tap one of the quick suggestions below!",
          timestamp: new Date().toISOString(),
        },
      ];
    }
    return JSON.parse(raw);
  },

  setChatHistory(msgs: ChatMessage[]): void {
    localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(msgs));
  },

  getSettings(): UserSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      return {
        geminiApiKey: '',
        geminiModel: 'gemini-2.5-flash',
        hasCompletedOnboarding: false,
        theme: 'dark',
      };
    }
    return JSON.parse(raw);
  },

  setSettings(settings: UserSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getDeductionHistory(): DeductionRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DEDUCTION_HISTORY);
    return raw ? JSON.parse(raw) : [];
  },

  saveDeductionRecord(record: DeductionRecord): void {
    const records = this.getDeductionHistory();
    records.unshift(record);
    localStorage.setItem(STORAGE_KEYS.DEDUCTION_HISTORY, JSON.stringify(records.slice(0, 30)));
  },

  removeLastDeduction(): DeductionRecord | null {
    const records = this.getDeductionHistory();
    if (records.length === 0) return null;
    const [removed, ...rest] = records;
    localStorage.setItem(STORAGE_KEYS.DEDUCTION_HISTORY, JSON.stringify(rest));
    return removed;
  },
};
