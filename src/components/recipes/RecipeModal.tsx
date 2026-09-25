import React, { useState, useEffect } from 'react';
import { X, Clock, Users, Flame, Utensils, Sparkles } from 'lucide-react';
import { Recipe, Ingredient, Equipment } from '../../types';

interface RecipeModalProps {
  isOpen: boolean;
  recipeToEdit?: Recipe | null;
  inventory: Ingredient[];
  equipmentList: Equipment[];
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
  onUpdate: (recipe: Recipe) => void;
}

const EMPTY_RECIPE: Omit<Recipe, 'id'> = {
  title: '',
  description: '',
  cuisine: '',
  prepTimeMinutes: 15,
  cookTimeMinutes: 30,
  servings: 2,
  difficulty: 'Medium',
  ingredients: [{ name: '', amount: 0, unit: '' }],
  equipment: [],
  steps: [{ headline: '', description: '', ingredientNames: [] }],
  tips: [],
};

export const RecipeModal: React.FC<RecipeModalProps> = ({
  isOpen,
  recipeToEdit,
  inventory,
  equipmentList,
  onClose,
  onSave,
  onUpdate,
}) => {
  const isEditing = !!recipeToEdit;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(15);
  const [cookTimeMinutes, setCookTimeMinutes] = useState(30);
  const [servings, setServings] = useState(2);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [ingredients, setIngredients] = useState<{ name: string; amount: number; unit: string }[]>([{ name: '', amount: 0, unit: '' }]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [steps, setSteps] = useState<{ headline: string; description: string; ingredientNames: string[] }[]>([{ headline: '', description: '', ingredientNames: [] }]);
  const [tips, setTips] = useState<string[]>(['']);
  const [stepIngredientSelections, setStepIngredientSelections] = useState<{ name: string; measurement: string }[][]>([[]]);

  useEffect(() => {
    if (recipeToEdit) {
      setTitle(recipeToEdit.title);
      setDescription(recipeToEdit.description);
      setCuisine(recipeToEdit.cuisine || '');
      setPrepTimeMinutes(recipeToEdit.prepTimeMinutes);
      setCookTimeMinutes(recipeToEdit.cookTimeMinutes);
      setServings(recipeToEdit.servings);
      setDifficulty(recipeToEdit.difficulty);
      setIngredients(recipeToEdit.ingredients.map((i) => ({ name: i.name, amount: i.amount, unit: i.unit })));
      setEquipment(recipeToEdit.equipment);
      setSteps(recipeToEdit.steps.map((s) => ({ ...s })));
      setTips(recipeToEdit.tips || ['']);
      setStepIngredientSelections(
        recipeToEdit.steps.map((s) =>
          s.ingredientNames.map((nameWithMeasurement) => {
            const [name, ...measurementParts] = nameWithMeasurement.split('|');
            const measurement = measurementParts.join('|');
            return { name, measurement };
          })
        )
      );
    } else {
      setTitle('');
      setDescription('');
      setCuisine('');
      setPrepTimeMinutes(15);
      setCookTimeMinutes(30);
      setServings(2);
      setDifficulty('Medium');
      setIngredients([{ name: '', amount: 0, unit: '' }]);
      setEquipment([]);
      setSteps([{ headline: '', description: '', ingredientNames: [] }]);
      setTips(['']);
      setStepIngredientSelections([[]]);
    }
  }, [recipeToEdit, isOpen]);

  if (!isOpen) return null;

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: 0, unit: '' }]);
  };

  const updateIngredient = (idx: number, field: string, value: string | number) => {
    setIngredients(
      ingredients.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing))
    );
  };

  const removeIngredient = (idx: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== idx));
    }
  };

  const addStep = () => {
    setSteps([...steps, { headline: '', description: '', ingredientNames: [] }]);
    setStepIngredientSelections([...stepIngredientSelections, []]);
  };

  const updateStep = (idx: number, field: string, value: string | string[]) => {
    setSteps(
      steps.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  const addStepIngredient = (stepIdx: number) => {
    setStepIngredientSelections(
      stepIngredientSelections.map((sel, i) =>
        i === stepIdx ? [...sel, { name: '', measurement: '' }] : sel
      )
    );
  };

  const removeStepIngredient = (stepIdx: number, ingIdx: number) => {
    setStepIngredientSelections(
      stepIngredientSelections.map((sel, i) =>
        i === stepIdx ? sel.filter((_, j) => j !== ingIdx) : sel
      )
    );
  };

  const updateStepIngredient = (stepIdx: number, ingIdx: number, field: 'name' | 'measurement', value: string) => {
    setStepIngredientSelections(
      stepIngredientSelections.map((sel, i) =>
        i === stepIdx
          ? sel.map((si, j) => (j === ingIdx ? { ...si, [field]: value } : si))
          : sel
      )
    );
  };

  const addEquipment = () => {
    setEquipment([...equipment, '']);
  };

  const updateEquipment = (idx: number, value: string) => {
    setEquipment(equipment.map((e, i) => (i === idx ? value : e)));
  };

  const removeEquipment = (idx: number) => {
    if (equipment.length > 1) {
      setEquipment(equipment.filter((_, i) => i !== idx));
    }
  };

  const addTip = () => {
    setTips([...tips, '']);
  };

  const updateTip = (idx: number, value: string) => {
    setTips(tips.map((t, i) => (i === idx ? value : t)));
  };

  const removeTip = (idx: number) => {
    if (tips.length > 1) {
      setTips(tips.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      return;
    }

    const recipe: Recipe = {
      id: recipeToEdit?.id || 'recipe-' + Date.now(),
      title: title.trim(),
      description: description.trim(),
      cuisine: cuisine.trim() || undefined,
      prepTimeMinutes,
      cookTimeMinutes,
      servings,
      difficulty,
      ingredients: ingredients.filter((i) => i.name.trim()).map((i) => ({
        name: i.name.trim(),
        amount: Number(i.amount) || 0,
        unit: i.unit.trim(),
      })),
      equipment: equipment.filter((e) => e.trim()),
      steps: steps.filter((s) => s.headline.trim()).map((s, idx) => ({
        headline: s.headline.trim(),
        description: s.description.trim(),
        ingredientNames: stepIngredientSelections[idx]?.map((si) => si.name + (si.measurement ? `|${si.measurement}` : '')).filter(Boolean) || [],
      })),
      tips: tips.filter((t) => t.trim()),
      isAiGenerated: recipeToEdit?.isAiGenerated || false,
      isFavorite: recipeToEdit?.isFavorite || false,
    };

    if (isEditing && recipeToEdit) {
      onUpdate(recipe);
    } else {
      onSave(recipe);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 pb-3 bg-slate-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-400" />
            <h2 className="text-base font-bold text-white">
              {isEditing ? 'Update Recipe' : 'Create New Recipe'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form & Actions */}
        <div className="flex-1 overflow-y-auto py-1">
          <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Recipe Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Garlic Butter Chicken"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 placeholder:text-slate-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the recipe..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 placeholder:text-slate-600 resize-none"
            />
          </div>

          {/* Cuisine + Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Cuisine</label>
              <input
                type="text"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                placeholder="e.g., Italian"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Times + Servings */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Prep (min)</label>
              <input
                type="number"
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Cook (min)</label>
              <input
                type="number"
                value={cookTimeMinutes}
                onChange={(e) => setCookTimeMinutes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Servings</label>
              <input
                type="number"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ingredients</label>
              <button onClick={addIngredient} className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold">
                + Add Ingredient
              </button>
            </div>
            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                    list="ingredient-list"
                    placeholder="Ingredient name"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 placeholder:text-slate-600"
                  />
                  <input
                    type="number"
                    value={ing.amount}
                    onChange={(e) => updateIngredient(idx, 'amount', Number(e.target.value))}
                    placeholder="Amt"
                    className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                    placeholder="unit"
                    className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                  {ingredients.length > 1 && (
                    <button onClick={() => removeIngredient(idx)} className="p-2 text-slate-500 hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <datalist id="ingredient-list">
            {inventory
              .filter((inv) => inv.name.trim())
              .map((inv) => (
                <option key={inv.name} value={inv.name} />
              ))}
          </datalist>

          {/* Equipment */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Equipment Needed</label>
              <button onClick={addEquipment} className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold">
                + Add Equipment
              </button>
            </div>
            <div className="space-y-2">
              {equipment.map((eq, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={eq}
                    onChange={(e) => updateEquipment(idx, e.target.value)}
                    placeholder="e.g., Chef's Knife"
                    list="equipment-list"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 placeholder:text-slate-600"
                  />
                  {equipment.length > 1 && (
                    <button onClick={() => removeEquipment(idx)} className="p-2 text-slate-500 hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <datalist id="equipment-list">
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.name} />
              ))}
            </datalist>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cooking Steps</label>
              <button onClick={addStep} className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold">
                + Add Step
              </button>
            </div>
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-orange-400">Step {idx + 1}</span>
                    {steps.length > 1 && (
                      <button onClick={() => {
                        const newSteps = steps.filter((_, i) => i !== idx);
                        setSteps(newSteps.length > 0 ? newSteps : [{ headline: '', description: '', ingredientNames: [] }]);
                      }} className="p-1 text-slate-500 hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={step.headline}
                    onChange={(e) => updateStep(idx, 'headline', e.target.value)}
                    placeholder="Step headline"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 placeholder:text-slate-600"
                  />
                  <textarea
                    value={step.description}
                    onChange={(e) => updateStep(idx, 'description', e.target.value)}
                    placeholder="Step description..."
                    rows={4}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 placeholder:text-slate-600 resize-none"
                  />
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
                      Ingredients Used
                    </label>
                    {(stepIngredientSelections[idx] || []).map((sel, ingIdx) => (
                      <div key={ingIdx} className="flex gap-2 mb-1.5">
                        <input
                          type="text"
                          value={sel.name}
                          onChange={(e) => updateStepIngredient(idx, ingIdx, 'name', e.target.value)}
                          list={`ingredient-options-${idx}`}
                          placeholder="Type or select..."
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 placeholder:text-slate-600"
                        />
                        <datalist id={`ingredient-options-${idx}`}>
                          {ingredients
                            .filter((inv) => inv.name.trim())
                            .map((inv) => (
                              <option key={inv.name} value={inv.name} />
                            ))}
                        </datalist>
                        <input
                          type="text"
                          value={sel.measurement}
                          onChange={(e) => updateStepIngredient(idx, ingIdx, 'measurement', e.target.value)}
                          placeholder="e.g., 200g"
                          className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 placeholder:text-slate-600"
                        />
                        <button
                          type="button"
                          onClick={() => removeStepIngredient(idx, ingIdx)}
                          className="p-1 text-slate-500 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addStepIngredient(idx)}
                      className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold mt-0.5"
                    >
                      + Add ingredient to step
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pro Tips</label>
              <button onClick={addTip} className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold">
                + Add Tip
              </button>
            </div>
            <div className="space-y-2">
              {tips.map((tip, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <textarea
                    value={tip}
                    onChange={(e) => updateTip(idx, e.target.value)}
                    placeholder="e.g., Let it rest for 5 minutes"
                    rows={2}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 placeholder:text-slate-600 resize-none"
                  />
                  {tips.length > 1 && (
                    <button onClick={() => removeTip(idx)} className="p-2 text-slate-500 hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-800 flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-bold transition-all border border-slate-700 active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4" />
            {isEditing ? 'Update Recipe' : 'Save Recipe'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};
