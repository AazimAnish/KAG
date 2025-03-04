export interface WardrobeItem {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: string;
  type: string;
  color?: string;
  size?: string;
  brand?: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export type FilterOptions = {
  type?: string;
  category?: string;
  season?: string;
  occasion?: string;
};

export const WARDROBE_CATEGORIES = {
  types: [
    'shirt',
    't-shirt',
    'hoodie',
    'sweater',
    'jacket',
    'pants',
    'jeans',
    'shorts',
    'dress',
    'skirt',
    'shoes',
    'accessories'
  ],
  patterns: [
    'solid',
    'striped',
    'plaid',
    'floral',
    'checkered',
    'printed',
    'textured'
  ],
  styles: [
    'casual',
    'formal',
    'business',
    'sporty',
    'vintage',
    'streetwear'
  ],
  fits: [
    'regular-fit',
    'slim-fit',
    'loose-fit',
    'oversized',
    'fitted',
    'relaxed'
  ]
} as const; 

export interface EventDetails {
  id: string;
  user_id: string;
  title: string;
  description: string;
  event_type: 'formal' | 'casual' | 'business' | 'party' | 'other';
  date: string;
  temperature?: number;
  weather?: string;
  created_at: string;
}

export interface OutfitRecommendation {
  event_id: string;
  items: WardrobeItem[];
  description: string;
  styling_tips: string[];
  created_at: string;
}

export interface OutfitSuggestion {
  id: string;
  user_id: string;
  event_id: string;
  recommendation: {
    description: string;
    items: Array<{
      id: string;
      type: string;
      styling_notes: string;
      image_url: string;
    }>;
    styling_tips: string[];
  };
  created_at: string;
  events?: OutfitEvent[];
}

export interface OutfitEvent {
  id: string;
  user_id: string;
  title: string;
  description: string;
  event_type: string;
  date: string;
  created_at: string;
}