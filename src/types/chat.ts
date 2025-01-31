export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface OutfitChat {
  id: string;
  user_id: string;
  outfit_id?: string;
  title: string;
  created_at: string;
  last_message_at: string;
} 