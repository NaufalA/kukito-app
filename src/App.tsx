import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Sparkles, BookOpen, Refrigerator, Wrench } from 'lucide-react';
import { Ingredient, Equipment, Recipe, DeductionItem, ChatMessage, UserSettings } from './types';
import { storageService, STARTER_RECIPES } from './services/storage';
import { Header } from './components/common/Header';
import { BottomNav, TabType } from './components/common/BottomNav';
import { Toast } from './components/common/Toast';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { CategoryFilter } from './components/pantry/CategoryFilter';
import { IngredientCard } from './components/pantry/IngredientCard';
import { IngredientModal } from './components/pantry/IngredientModal';
import { EquipmentCard } from './components/equipment/EquipmentCard';
import { EquipmentModal } from './components/equipment/EquipmentModal';
import { RecipeCard } from './components/recipes/RecipeCard';
import { RecipeDetailModal } from './components/recipes/RecipeDetailModal';
import { CookingGuideModal } from './components/recipes/CookingGuideModal';
import { DeductionModal } from './components/recipes/DeductionModal';
import { ChatInterface } from './components/ai/ChatInterface';
import { SettingsView } from './components/settings/SettingsView';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('pantry');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<UserSettings>(storageService.getSettings());

  // Search & Filter States
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<Recipe | null>(null);
  const [activeCookingRecipe, setActiveCookingRecipe] = useState<Recipe | null>(null);
  const [activeDeductionRecipe, setActiveDeductionRecipe] = useState<Recipe | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [canUndoDeduction, setCanUndoDeduction] = useState(false);

  // Initial Data Load
  useEffect(() => {
    const savedIngs = storageService.getIngredients();
    const savedEquip = storageService.getEquipment();
    const savedRecs = storageService.getRecipes();
    const savedChat = storageService.getChatHistory();
    const currentSettings = storageService.getSettings();

    setIngredients(savedIngs);
    setEquipment(savedEquip);
    setRecipes(savedRecs);
    setChatMessages(savedChat);
    setSettings(currentSettings);

    if (!currentSettings.hasCompletedOnboarding && savedIngs.length === 0) {
      setIsOnboardingOpen(true);
    }
  }, []);

  // Save changes
  const updateIngredients = (newItems: Ingredient[]) => {
    setIngredients(newItems);
    storageService.setIngredients(newItems);
  };

  const updateEquipment = (newItems: Equipment[]) => {
    setEquipment(newItems);
    storageService.setEquipment(newItems);
  };

  const updateRecipes = (newRecipes: Recipe[]) => {
    setRecipes(newRecipes);
    storageService.setRecipes(newRecipes);
  };

  const updateChat = (newChat: ChatMessage[]) => {
    setChatMessages(newChat);
    storageService.setChatHistory(newChat);
  };

  // Pantry Handlers
  const handleQuantityDelta = (id: string, delta: number) => {
    const updated = ingredients.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(0, parseFloat((item.quantity + delta).toFixed(2))) } : item
    );
    updateIngredients(updated);
  };

  const handleSaveIngredient = (data: Omit<Ingredient, 'id'>, id?: string) => {
    if (id) {
      updateIngredients(ingredients.map((item) => (item.id === id ? { ...data, id } : item)));
    } else {
      const newIng: Ingredient = { ...data, id: 'ing-' + Date.now() };
      updateIngredients([newIng, ...ingredients]);
    }
  };

  const handleDeleteIngredient = (id: string) => {
    updateIngredients(ingredients.filter((item) => item.id !== id));
  };

  // Equipment Handlers
  const handleToggleEquipment = (id: string) => {
    const updated = equipment.map((e) => (e.id === id ? { ...e, isAvailable: !e.isAvailable } : e));
    updateEquipment(updated);
  };

  const handleAddEquipment = (data: Omit<Equipment, 'id'>) => {
    const newTool: Equipment = { ...data, id: 'equip-' + Date.now() };
    updateEquipment([...equipment, newTool]);
  };

  const handleDeleteEquipment = (id: string) => {
    updateEquipment(equipment.filter((e) => e.id !== id));
  };

  // Cooking & Deductions
  const handleConfirmDeduction = (itemsToDeduct: DeductionItem[]) => {
    const deductedRecords: { ingredientId: string; ingredientName: string; amount: number; unit: string }[] = [];

    const updated = ingredients.map((ing) => {
      const deduction = itemsToDeduct.find((d) => d.ingredientId === ing.id);
      if (deduction && deduction.deductAmount > 0) {
        deductedRecords.push({
          ingredientId: ing.id,
          ingredientName: ing.name,
          amount: deduction.deductAmount,
          unit: ing.unit,
        });
        return {
          ...ing,
          quantity: Math.max(0, parseFloat((ing.quantity - deduction.deductAmount).toFixed(2))),
        };
      }
      return ing;
    });

    if (deductedRecords.length > 0 && activeDeductionRecipe) {
      storageService.saveDeductionRecord({
        id: 'deduct-' + Date.now(),
        recipeId: activeDeductionRecipe.id,
        recipeTitle: activeDeductionRecipe.title,
        timestamp: new Date().toISOString(),
        deductedItems: deductedRecords,
      });

      updateIngredients(updated);
      setToastMessage(`Cooked "${activeDeductionRecipe.title}"! Deducted ${deductedRecords.length} ingredients 🤌`);
      setCanUndoDeduction(true);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const handleUndoDeduction = () => {
    const lastRecord = storageService.removeLastDeduction();
    if (!lastRecord) return;

    const restored = ingredients.map((ing) => {
      const match = lastRecord.deductedItems.find((d) => d.ingredientId === ing.id);
      if (match) {
        return { ...ing, quantity: parseFloat((ing.quantity + match.amount).toFixed(2)) };
      }
      return ing;
    });

    updateIngredients(restored);
    setToastMessage('Deduction undone! Inventory restored.');
    setCanUndoDeduction(false);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered ingredients
  const filteredIngredients = ingredients.filter((ing) => {
    const matchesCategory = selectedCategory === 'all' || ing.category === selectedCategory;
    const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryCounts = ingredients.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    acc['all'] = (acc['all'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 pb-20">
      {/* App Header */}
      <Header
        ingredientCount={ingredients.filter((i) => i.quantity > 0).length}
        equipmentCount={equipment.filter((e) => e.isAvailable).length}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Floating Undo Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onUndo={canUndoDeduction ? handleUndoDeduction : undefined}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 pt-4">
        {/* TAB 1: PANTRY */}
        {activeTab === 'pantry' && (
          <div className="space-y-3.5">
            {/* Search & Add Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pantry items..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 placeholder:text-slate-500"
                />
              </div>

              <button
                onClick={() => {
                  setEditingIngredient(null);
                  setIsIngredientModalOpen(true);
                }}
                className="flex items-center gap-1 px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            {/* Category Filter Pills */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categoryCounts={categoryCounts}
            />

            {/* Ingredients List */}
            {filteredIngredients.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl">
                <Refrigerator className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-300">No ingredients found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Add items to your pantry or tap the + Add Item button above!
                </p>
                <button
                  onClick={() => setIsOnboardingOpen(true)}
                  className="mt-4 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-orange-400 rounded-xl text-xs font-semibold border border-slate-700 active:scale-95"
                >
                  Run Starter Checklist 🤌
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredIngredients.map((item) => (
                  <IngredientCard
                    key={item.id}
                    ingredient={item}
                    onUpdateQuantity={handleQuantityDelta}
                    onEdit={(ing) => {
                      setEditingIngredient(ing);
                      setIsIngredientModalOpen(true);
                    }}
                    onDelete={handleDeleteIngredient}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EQUIPMENT */}
        {activeTab === 'equipment' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">Kitchen Tools & Appliances</h2>
                <p className="text-[11px] text-slate-400">Toggle what's clean and ready to cook with.</p>
              </div>

              <button
                onClick={() => setIsEquipmentModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Add Tool
              </button>
            </div>

            <div className="space-y-2">
              {equipment.map((tool) => (
                <EquipmentCard
                  key={tool.id}
                  equipment={tool}
                  onToggle={handleToggleEquipment}
                  onDelete={handleDeleteEquipment}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AI CHEF CHAT */}
        {activeTab === 'ai' && (
          <ChatInterface
            chatMessages={chatMessages}
            ingredients={ingredients}
            equipment={equipment}
            apiKey={settings.geminiApiKey}
            model={settings.geminiModel}
            savedRecipes={recipes}
            onSendMessage={(msg) => updateChat([...chatMessages, msg])}
            onSaveRecipe={(recipe) => {
              if (!recipes.some((r) => r.id === recipe.id)) {
                updateRecipes([recipe, ...recipes]);
                setToastMessage(`Saved "${recipe.title}" to recipes! 🤌`);
                setTimeout(() => setToastMessage(null), 3000);
              }
            }}
            onCookRecipe={(recipe) => {
              setActiveDeductionRecipe(recipe);
            }}
            onOpenSettings={() => setActiveTab('settings')}
            onClearChat={() => {
              updateChat([
                {
                  id: 'welcome-reset',
                  sender: 'assistant',
                  text: "Fresh chat started! What culinary idea shall we explore with your ingredients today? 🤌",
                  timestamp: new Date().toISOString(),
                },
              ]);
            }}
          />
        )}

        {/* TAB 4: RECIPES */}
        {activeTab === 'recipes' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">Recipe Collection</h2>
                <p className="text-[11px] text-slate-400">
                  {recipes.length} recipes matched against your pantry
                </p>
              </div>

              <button
                onClick={() => setActiveTab('ai')}
                className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" /> Ask AI Chef
              </button>
            </div>

            <div className="space-y-2.5">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  inventory={ingredients}
                  onOpen={(rec) => setSelectedRecipeDetail(rec)}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={(newSettings) => {
              setSettings(newSettings);
              storageService.setSettings(newSettings);
            }}
            onRunOnboarding={() => setIsOnboardingOpen(true)}
            onResetAllData={() => {
              localStorage.clear();
              setIngredients([]);
              setEquipment([]);
              setRecipes(STARTER_RECIPES);
              setChatMessages([]);
              setSettings(storageService.getSettings());
              setIsOnboardingOpen(true);
            }}
          />
        )}
      </main>

      {/* Bottom Nav Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        recipeCount={recipes.length}
      />

      {/* MODALS */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={(newIngs, newEquip, newApiKey) => {
          updateIngredients(newIngs);
          updateEquipment(newEquip);
          const updatedSettings = {
            ...settings,
            geminiApiKey: newApiKey || settings.geminiApiKey,
            hasCompletedOnboarding: true,
          };
          setSettings(updatedSettings);
          storageService.setSettings(updatedSettings);
          setIsOnboardingOpen(false);
          setToastMessage('Kitchen setup complete! Welcome to Kukito! 🤌');
          setTimeout(() => setToastMessage(null), 3500);
        }}
      />

      <IngredientModal
        isOpen={isIngredientModalOpen}
        ingredientToEdit={editingIngredient}
        onClose={() => setIsIngredientModalOpen(false)}
        onSave={handleSaveIngredient}
        onDelete={handleDeleteIngredient}
      />

      <EquipmentModal
        isOpen={isEquipmentModalOpen}
        onClose={() => setIsEquipmentModalOpen(false)}
        onAdd={handleAddEquipment}
      />

      <RecipeDetailModal
        isOpen={!!selectedRecipeDetail}
        recipe={selectedRecipeDetail}
        inventory={ingredients}
        equipmentList={equipment}
        onClose={() => setSelectedRecipeDetail(null)}
        onStartCooking={(rec) => {
          setSelectedRecipeDetail(null);
          setActiveCookingRecipe(rec);
        }}
        onDirectCookDeduct={(rec) => {
          setSelectedRecipeDetail(null);
          setActiveDeductionRecipe(rec);
        }}
      />

      {activeCookingRecipe && (
        <CookingGuideModal
          isOpen={true}
          recipe={activeCookingRecipe}
          onClose={() => setActiveCookingRecipe(null)}
          onFinishCooking={() => {
            const recipeToDeduct = activeCookingRecipe;
            setActiveCookingRecipe(null);
            setActiveDeductionRecipe(recipeToDeduct);
          }}
        />
      )}

      {activeDeductionRecipe && (
        <DeductionModal
          isOpen={true}
          recipe={activeDeductionRecipe}
          inventory={ingredients}
          onClose={() => setActiveDeductionRecipe(null)}
          onConfirmDeduction={handleConfirmDeduction}
        />
      )}
    </div>
  );
}
