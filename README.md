# AI Wardrobe Assistant

## 📌 Project Overview
AI Wardrobe Assistant is an intelligent fashion assistant that helps users curate outfits based on their wardrobe, body profile, and event requirements. Users can register, upload clothing items, and request outfit recommendations for different occasions using text or voice input. The AI analyzes user data and suggests the best clothing combinations.

## 🛠️ Tech Stack
- **Frontend:** Next.js 15 (App Router), TypeScript, ShadCN
- **Backend:** Supabase (Database & Auth)
- **AI Models:**
  - **Llama-3.2-90B-Vision (Groq):** Outfit recommendations
  - **Mixtral-8x7b-32768:** Chat-based recommendation refinement
- **Additional Libraries:**
  - `@speechly/react` for voice input processing
  - TailwindCSS for styling

## 🚀 Features
### 1. User Authentication
- Secure sign-up & login using Supabase Auth
- Profile setup with user image, body size, and shape

### 2. Wardrobe Management
- Users can upload images of clothing items (shirts, pants, dresses, etc.)
- Categorization based on type, color, and season

### 3. Event Stylist Assistant
#### **Event Details Input**
- Users provide event details via:
  - **Text Input:** "I need a formal outfit for a wedding."
  - **Voice Input:** Speech-to-text conversion using `@speechly/react`
- Event details stored in Supabase

#### **AI Outfit Recommendation**
- Uses **Llama-3.2-90B-Vision** to analyze:
  - User wardrobe for matching items
  - Preferences (body type, style, colors)
  - Event-specific outfit suggestions

#### **AI Chat Assistance**
- Users can refine recommendations via chat using **Mixtral-8x7b-32768**
- Stores chat history for personalized suggestions
- Allows new task creation based on feedback

## 📂 Project Structure
```
/ai-wardrobe-assistant
├── /app  # Next.js App Router setup
│   ├── /auth  # User authentication
│   ├── /wardrobe  # Clothing management
│   ├── /event  # Event input and AI recommendation
│   ├── /chat  # AI-powered conversation for refining recommendations
├── /components  # Reusable UI components
├── /lib  # Utility functions & API calls
├── /public  # Static assets
├── /styles  # TailwindCSS styles
├── /server  # API routes for AI integration
├── README.md
└── package.json
```

## 🛠️ Setup & Installation
### Prerequisites
- Node.js 18+
- Supabase account & project
- API keys for **Groq (Llama-3.2-90B-Vision, Mixtral-8x7b-32768)**

### Installation Steps
1. **Clone the repository:**
   ```sh
   git clone https://github.com/AazimAnish/kag-ai
   cd kag-ai
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Set up environment variables:**
   Create a `.env.local` file and add:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   ```
4. **Run the project:**
   ```sh
   npm run dev
   ```

## 📌 Future Enhancements
- Outfit recommendations based on weather conditions
- Integration with online stores for shopping suggestions
- Social sharing of outfit ideas
- AI-driven wardrobe organization

---
🚀 **AI Wardrobe Assistant** - Your AI-powered fashion guide!
