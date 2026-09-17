# Kukito! 🤌 — Smart Kitchen & Recipe AI

A mobile-first, offline-ready Progressive Web App (PWA) built with **React 19, TypeScript, Tailwind CSS v4, and Vite**. Kukito empowers home cooks to manage kitchen inventory, track equipment, chat with an integrated Google Gemini AI Chef to generate recipes tailored to what's in stock, and cook with an editable ingredient deduction and undo system.

---

## 🌟 Key Features

### 🥫 1. Pantry & Stock Management
- **Categorized Inventory**: Produce, Dairy & Eggs, Meat & Seafood, Pantry & Grains, Spices & Seasonings, Condiments & Oils, and Frozen.
- **Tactile Quick Steppers**: One-tap `+` / `-` buttons to adjust quantities without opening forms.
- **Low-Stock Alerts**: Visual threshold badges alerting when staples need restocking.
- **Instant Search & Category Pills**: Fast real-time filtering with live counts.

### 🍳 2. Kitchen Tools & Equipment Tracker
- Track cookware, small appliances, prep tools, and baking equipment.
- Instant toggles between **"Ready"** and **"Inactive"**.
- Kukito AI checks tool readiness before recommending recipes requiring specific equipment.

### 🤖 3. AI Chef Assistant (Google Gemini + Offline Fallback)
- **Context Injection**: Automatically injects live in-stock ingredients and available gear into prompts.
- **Dual Engine**:
  - **Live Gemini API**: Connects to Google's `gemini-2.5-flash` or `gemini-1.5-flash` using your stored key.
  - **Smart Offline Engine**: Instantly generates delicious, valid recipes even without internet or an API key.
- **Quick Prompts**: One-tap suggestions (*"What can I cook right now?"*, *"Quick 15-minute meal"*, *"Healthy high-protein dish"*).
- **Interactive Recipe Cards**: Rendered inline in chat with **"Save Recipe"** and **"Cook & Deduct"** actions.

### 📖 4. Recipe Collection & Stock Matching
- **Match Indicators**: Real-time badges showing *"Ready (All In Stock)"* or missing item counts for every recipe.
- **Recipe Details**: Prep/cook times, difficulty ratings, ingredient checklists, and step-by-step instructions.

### ⏱️ 5. Interactive Cooking Mode
- Step-by-step checkable progress list.
- Built-in kitchen timer with fast `+3m`, `+5m`, and `+10m` quick add buttons.
- Seamless transition to ingredient deduction upon finishing.

### 🔄 6. Editable Ingredient Deduction & One-Click Undo
- Displays all recipe ingredients matched against live inventory.
- **Custom Deductions**: Adjust amounts with `+` / `-` steppers or direct numeric inputs.
- **Exclude Items**: Toggle checkboxes to skip items (e.g. borrowed ingredients).
- **Live Stock Preview**: Real-time preview of remaining inventory before confirming.
- **One-Click Undo**: Floating toast notification with an instant **Undo** button to roll back accidental deductions.

### 📱 7. 100% Offline Progressive Web App (PWA)
- Full Web App Manifest and Workbox Service Worker caching.
- Installable directly to the home screen on Android, iOS, and Desktop as a standalone app.

---

## 🛠️ Tech Stack & Open-Source Compliance

All libraries and assets used in Kukito! are 100% free and open-source for commercial and personal use:

| Component | Technology | License |
| :--- | :--- | :--- |
| **Framework** | React 19 (`react`, `react-dom`) | MIT |
| **Language** | TypeScript 5.x | Apache 2.0 |
| **Build Tool** | Vite 8.x | MIT |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) | MIT |
| **Icons** | Lucide React | ISC |
| **Offline PWA** | `vite-plugin-pwa` + Workbox | MIT |
| **Typography** | Plus Jakarta Sans | SIL Open Font License 1.1 |

---

## 📂 Project Structure

```text
kukito-app/
├── docs/
│   ├── implementation_plan.md   # Architectural specifications
│   └── walkthrough.md           # Visual walkthrough & feature documentation
├── src/
│   ├── components/
│   │   ├── ai/                  # AI Chef chat interface & recipe cards
│   │   ├── common/              # Header, BottomNav, Toast notifications
│   │   ├── equipment/           # Equipment cards and modal
│   │   ├── onboarding/          # 3-step interactive setup wizard
│   │   ├── pantry/              # Ingredient cards, modals, category filters
│   │   ├── recipes/             # Recipe collection, detail, cooking guide, deduction
│   │   └── settings/            # API key setup, reset wizard
│   ├── services/
│   │   ├── gemini.ts            # Google Gemini API client & offline generator
│   │   └── storage.ts           # Typed localStorage persistence
│   ├── types/
│   │   └── index.ts             # TypeScript data models
│   ├── App.tsx                  # Main application shell & tab routing
│   ├── index.css                # Tailwind CSS v4 styling
│   └── main.tsx                 # React DOM root
├── index.html                   # HTML entry point & PWA meta
├── package.json
├── tsconfig.json
└── vite.config.ts               # Vite configuration with PWA plugin
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd kukito-app

# Install dependencies
npm install
```

### Development
Start the local Vite development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production
```bash
npm run build
```
Preview the production build locally:
```bash
npm run preview
```

---

## 🌿 Git Branching Strategy

- **`main`**: Production-ready, stable releases.
- **`development`**: Active feature integration and development branch. Feature branches are branched off and merged back into `development`.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
