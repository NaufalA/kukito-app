import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Key, AlertCircle, RotateCcw } from 'lucide-react';
import { ChatMessage, Recipe, Ingredient, Equipment } from '../../types';
import { generateRecipeWithGemini } from '../../services/gemini';
import { QuickPrompts } from './QuickPrompts';
import { RecipeCardAi } from './RecipeCardAi';

interface ChatInterfaceProps {
  chatMessages: ChatMessage[];
  ingredients: Ingredient[];
  equipment: Equipment[];
  apiKey: string;
  model: string;
  savedRecipes: Recipe[];
  onSendMessage: (msg: ChatMessage) => void;
  onSaveRecipe: (recipe: Recipe) => void;
  onCookRecipe: (recipe: Recipe) => void;
  onOpenSettings: () => void;
  onClearChat: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  chatMessages,
  ingredients,
  equipment,
  apiKey,
  model,
  savedRecipes,
  onSendMessage,
  onSaveRecipe,
  onCookRecipe,
  onOpenSettings,
  onClearChat,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  const handleSend = async (userPrompt: string) => {
    if (!userPrompt.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: userPrompt.trim(),
      timestamp: new Date().toISOString(),
    };
    onSendMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateRecipeWithGemini(
        userPrompt,
        ingredients,
        equipment,
        model,
      );

      const botMessage: ChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toISOString(),
        generatedRecipe: response.recipe,
      };
      onSendMessage(botMessage);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: 'bot-err-' + Date.now(),
        sender: 'assistant',
        text: 'Sorry, I hit a snag crafting your recipe. Please check your Gemini API key in Settings or try again! 🤌',
        timestamp: new Date().toISOString(),
      };
      onSendMessage(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Top Bar inside Chat */}
      <div className="flex items-center justify-between px-1 py-1.5 mb-2">
        <div className="flex items-center gap-2">
          {!apiKey && (
            <button
              onClick={onOpenSettings}
              className="text-[11px] bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-semibold px-2.5 py-1 rounded-lg border border-orange-500/30 flex items-center gap-1.5 transition-all"
            >
              <Key className="w-3 h-3" /> Connect Gemini Key
            </button>
          )}
        </div>

        <button
          onClick={onClearChat}
          className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
          title="Reset conversation"
        >
          <RotateCcw className="w-3 h-3" /> Clear Chat
        </button>
      </div>

      {/* Messages Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3.5 pr-1 pb-2">
        {chatMessages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isSaved = msg.generatedRecipe
            ? savedRecipes.some((r) => r.id === msg.generatedRecipe?.id || r.title === msg.generatedRecipe?.title)
            : false;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${isUser
                  ? 'bg-orange-600 text-white rounded-br-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-sm shadow-sm'
                  }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">
                    <span>Chef Kukito 🤌</span>
                  </div>
                )}
                <p className="whitespace-pre-line">{msg.text}</p>

                {msg.generatedRecipe && (
                  <RecipeCardAi
                    recipe={msg.generatedRecipe}
                    isSaved={isSaved}
                    onSave={onSaveRecipe}
                    onCook={onCookRecipe}
                  />
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-orange-400 p-3 bg-slate-900 border border-slate-800 rounded-2xl max-w-[70%]">
            <span className="animate-spin text-sm">🤌</span>
            <span className="font-semibold animate-pulse">Chef Kukito is crafting your recipe...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="py-2">
        <QuickPrompts onSelectPrompt={handleSend} disabled={isLoading} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="flex items-center gap-2 pt-2 border-t border-slate-800"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Chef Kukito (e.g., 'What can I make with chicken & rice?')"
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="w-10 h-10 rounded-xl bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none active:scale-95 transition-all shadow-md shadow-orange-600/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
