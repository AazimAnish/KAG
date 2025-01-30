export interface WardrobeItem {
  id: string;
  user_id: string;
  image_url: string;
  type: string;
  tags: string[];
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
}

export type FilterOptions = {
  type?: string;
  occasion?: string;
  season?: string;
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