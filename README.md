# KAG AI - AI-Powered Fashion Assistant

## 🌟 Overview
KAG AI is a sophisticated AI-powered fashion assistant that revolutionizes personal styling through advanced machine learning and computer vision. Built with Next.js 15, TypeScript, and integrated with cutting-edge AI models via Groq, it offers personalized wardrobe management, virtual try-ons, intelligent outfit recommendations, and AI-powered styling advice through an intuitive chat interface.

## 🚀 Key Features

### 1. Smart Wardrobe Management
- **AI-Powered Organization**: Automatic categorization and tagging of clothing items using Llama-3.2-90B-Vision
- **Visual Recognition**: Advanced image analysis for clothing type, color, pattern, style, and fit detection
- **Digital Closet**: Intuitive interface for managing your virtual wardrobe with filtering and search capabilities
- **Automatic Metadata Extraction**: Analyzes uploaded images to extract clothing type, color, and style tags

### 2. Virtual Try-On Technology
- **Powered by TryOnDiffusion**: Implementation of "TryOnDiffusion: A Tale of Two UNets" for realistic virtual try-ons
- **Fal.ai Integration**: Uses the fal.ai API to handle virtual try-on processing with comprehensive parameters
- **Real-time Visualization**: See how clothes look on you instantly with status updates during processing
- **Multi-Item Combinations**: Try different tops and bottoms together with cascading image processing
- **Try-On History**: View and manage previous virtual try-on attempts

### 3. AI Outfit Recommendation
- **Event-Based Suggestions**: Custom outfit recommendations for specific occasions, dates, and event types
- **Personalized Styling**: Recommendations based on user profile data (body type, gender, style preferences)
- **Mixed Recommendations**: Intelligently combines user's wardrobe items with store products in recommendations
- **Styling Notes**: Detailed styling advice for each recommended item and overall outfit
- **Shopping Integration**: "Buy Now" and "Add to Cart" functionality for recommended store items

### 4. AI Style Assistant Chat
- **Powered by Deepseek-r1-distill-llama-70b**: Context-aware styling advice via Groq API
- **Outfit-Specific Chat**: Detailed conversations about specific outfit recommendations
- **General Fashion Advice**: Answer any fashion or style-related questions
- **Chat History**: Persistent conversation history for continued styling assistance
- **Multimodal Context**: Uses both text descriptions and visual outfit information for better advice

### 5. Smart Shopping Integration
- **Curated Recommendations**: AI-powered shopping suggestions based on wardrobe analysis
- **Style Matching**: Find store items that complement your existing wardrobe
- **Seamless Purchasing**: Direct integration with shopping cart and checkout functionality
- **Product Management**: Admin interface for managing store inventory and product details

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Components**: ShadCN, TailwindCSS
- **State Management**: React Hooks
- **Animations**: Framer Motion
- **Image Processing**: Next.js Image component with optimization
- **Form Handling**: React Hook Form with Zod validation

### Backend & Infrastructure
- **Database**: Supabase (PostgreSQL)
  - Tables: profiles, wardrobe_items, products, events, outfit_recommendations, outfit_tryons, outfit_chats, chat_messages
- **Authentication**: Supabase Auth with email/password and secure sessions
- **Storage**: Supabase Storage for images and assets
- **API Routes**: Next.js API Routes with server-side processing
- **Error Handling**: Comprehensive error management with user feedback

### AI Models & Integration
- **Clothing Analysis**: Llama-3.2-90B-Vision (via Groq) for image classification and tagging
- **Outfit Recommendations**: Llama 3.3 70B Versatile (via Groq) with structured JSON output
- **Fashion Chat Assistant**: Llama 3.3 70B Versatile (via Groq) for conversational fashion advice
- **Virtual Try-On**: fal.ai API implementing TryOnDiffusion architecture
- **AI Provider**: Groq for fast and reliable AI model inference

### Additional Technologies
- **Image Processing**: fal.ai for advanced clothing try-on simulations
- **Theme System**: Next-themes for dark/light mode
- **Caching**: In-memory caching for clothing analysis to improve performance
- **Responsive Design**: Mobile-first approach with responsive components

## 📁 Project Structure
```
/src
├── app/                       # Next.js 15 App Router pages
│   ├── api/                   # API routes
│   │   ├── analyze-clothing/  # Clothing analysis API endpoint
│   │   ├── outfit-chat/       # Fashion chat API endpoint
│   │   ├── outfit-recommendations/ # Outfit recommendation endpoint
│   │   ├── outfit-tryon/      # Virtual try-on API endpoint
│   │   ├── admin/            # Admin-related APIs
│   │   ├── auth/             # Authentication APIs
│   │   └── profile/          # User profile APIs
│   ├── dashboard/            # User dashboard routes
│   ├── admin/                # Admin panel routes
│   ├── store/                # Store and shopping routes
│   ├── cart/                 # Shopping cart routes
│   ├── auth/                 # Authentication routes
│   └── (auth)/               # Protected routes
├── components/               # Reusable UI components
│   ├── admin/                # Admin dashboard components
│   ├── chat/                 # Chat interface components
│   ├── dashboard/            # User dashboard components
│   ├── home/                 # Landing page components
│   ├── layout/               # Layout components
│   ├── navigation/           # Navigation components
│   ├── theme/                # Theme components
│   ├── ui/                   # Shadcn UI components
│   └── wardrobe/             # Wardrobe management components
│       ├── OutfitRecommender.tsx  # Outfit recommendation component
│       ├── OutfitTryOn.tsx        # Virtual try-on component
│       ├── WardrobeGrid.tsx       # Wardrobe items display
│       └── WardrobeUpload.tsx     # Item upload component
├── hooks/                    # Custom React hooks
├── lib/                      # Utility functions and configurations
│   └── supabase/             # Supabase client and server configs
├── types/                    # TypeScript type definitions
└── utils/                    # Helper functions and constants

/KAG-Model                    # TryOnDiffusion Model Implementation
├── tryondiffusion/           # Core model components
├── examples/                 # Usage examples and tests
└── assets/                   # Model assets and examples
```

## 🧠 AI Models & Implementation Details

### 1. Clothing Analysis API (Llama-3.2-90B-Vision)
- **Endpoint**: `/api/analyze-clothing`
- **Model**: Llama-3.2-90B-Vision (Groq)
- **Features**:
  - Analyzes uploaded clothing images to extract metadata
  - Returns clothing type, color, pattern, style, and fit
  - Implements efficient base64 conversion and request handling
  - Includes in-memory caching to avoid repeated analysis
  - Error handling with fallback values

### 2. Outfit Recommendation API (Llama 3.3 70B Versatile)
- **Endpoint**: `/api/outfit-recommendations`
- **Model**: Llama 3.3 70B Versatile (Groq)
- **Features**:
  - Generates personalized outfit recommendations based on event type, user profile, and available items
  - Combines wardrobe items with store products for complete outfits
  - Returns structured JSON with outfit description, items, and styling tips
  - Filters redundant store items to prevent similar recommendations
  - Implements timeout handling for API requests
  - Error recovery for malformed responses

### 3. Fashion Chat API (Llama 3.3 70B Versatile)
- **Endpoint**: `/api/outfit-chat`
- **Model**: Llama 3.3 70B Versatile (Groq)
- **Features**:
  - Provides context-aware fashion advice
  - Supports both outfit-specific and general fashion questions
  - Dynamically builds contextual prompts based on outfit details
  - Persists chat history in the database
  - Provides different welcome messages for different chat types

### 4. Virtual Try-On API (fal.ai)
- **Endpoint**: `/api/outfit-tryon`
- **Service**: fal.ai fashn/tryon model
- **Features**:
  - Processes user photos with selected clothing items
  - Supports both tops and bottoms with appropriate category settings
  - Cascades processing for multi-item try-ons
  - Customizable parameters for realistic try-on results
  - Persists try-on history in the database

## 🌐 API Endpoints

### User-Facing Endpoints
- **POST /api/analyze-clothing**: Analyzes clothing images for metadata
- **POST /api/outfit-recommendations**: Generates outfit recommendations
- **POST /api/outfit-chat**: Processes fashion advice queries
- **POST /api/outfit-tryon**: Handles virtual try-on requests
- **GET/POST /api/profile**: Manages user profile information

### Admin Endpoints
- **GET/POST /api/admin/products**: Manages store products
- **GET/POST /api/admin/users**: Manages user accounts
- **GET/POST /api/admin/stats**: Retrieves application statistics

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account and project
- Groq API key
- Fal.ai API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/kag-ai.git
cd kag-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
FAL_KEY=your_fal_ai_key
```

4. Set up Supabase tables:
- profiles: User profiles with body measurements and preferences
- wardrobe_items: User's clothing items
- products: Store products for recommendations
- events: User events for outfit recommendations
- outfit_recommendations: Generated outfit recommendations
- outfit_tryons: Virtual try-on results
- outfit_chats: Chat conversations about outfits
- chat_messages: Individual messages in chats

5. Run the development server:
```bash
npm run dev
```

## 🔐 Authentication Flow
1. User registration with email/password or social providers
2. Profile creation with body measurements and style preferences
3. Secure session management with Supabase Auth
4. Role-based access control (User/Admin)
5. Protected routes with authentication checks

## 📱 Core Functionalities

### Wardrobe Management
- Upload and categorize clothing items with AI-powered tagging
- Browse, filter, and search your digital wardrobe
- View detailed information about each item
- Delete or update wardrobe items

### Outfit Recommendations
- Select event type, date, and description
- Generate AI-powered outfit recommendations
- View detailed styling notes for each item
- Save and manage outfit recommendations
- Chat with AI about specific outfits

### Virtual Try-On
- Select clothing items to try on
- Upload or select your photo
- View realistic try-on results
- Browse try-on history
- Share try-on results

### Fashion Chat Assistant
- Ask general fashion questions
- Get advice about specific outfits
- Browse chat history
- Start new conversations

### Shopping Experience
- View and purchase recommended items
- Add items to cart
- Browse store products
- Complete checkout process

## 🌟 Unique Features

### Smart Item Pairing
The system intelligently combines wardrobe items with store products to create cohesive outfits, analyzing color compatibility, style matching, and occasion appropriateness.

### Contextual Fashion Advice
The chat system provides tailored advice based on specific outfits, understanding the visual and descriptive context of the items.

### Efficient AI Processing
The application implements various optimizations for AI requests, including:
- Caching for repeated clothing analysis
- Efficient base64 conversion for large images
- Timeout handling for long-running requests
- Fallback values for error cases

### Seamless Try-On Experience
The virtual try-on feature supports sequential processing, allowing users to try on multiple items (tops and bottoms) with a cascading approach that maintains quality.

## 🛡️ Security Features
- Secure authentication with Supabase
- Protected API routes with server-side validation
- Input validation with Zod
- Secure file uploads with validation
- Rate limiting on API endpoints
- NSFW filtering in try-on results

## 📈 Future Enhancements
- [ ] Mobile app development with React Native
- [ ] Social sharing features for outfits and try-ons
- [ ] AR/VR integration for immersive try-on experiences
- [ ] Advanced analytics dashboard for usage patterns
- [ ] AI-powered size recommendations
- [ ] Community features and user-generated content
- [ ] Seasonal trend analysis and recommendations
- [ ] Integration with more e-commerce platforms

## 🤝 Contributing
Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments
- [TryOnDiffusion Paper](https://arxiv.org/abs/2306.08276) for the virtual try-on technology
- [Groq](https://groq.com/) for fast and reliable AI model hosting
- [Supabase](https://supabase.com/) for backend infrastructure
- [Fal.ai](https://fal.ai/) for advanced image processing capabilities
- [ShadcnUI](https://ui.shadcn.com/) for beautiful UI components
- [Next.js](https://nextjs.org/) for the React framework

---

Built with ❤️ by the KAG AI Team
