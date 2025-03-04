export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string 
          name: string | null
          gender: string | null
          body_type: string | null
          avatar_url: string | null
          measurements: {
            height: number
            weight: number
            chest: number
            waist: number
            hips?: number
          } | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          gender?: string | null
          body_type?: string | null
          avatar_url?: string | null
          measurements?: {
            height: number
            weight: number
            chest: number
            waist: number
            hips?: number
          } | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          gender?: string | null
          body_type?: string | null
          avatar_url?: string | null
          measurements?: {
            height: number
            weight: number
            chest: number
            waist: number
            hips?: number
          } | null
          created_at?: string
          updated_at?: string
        }
      }
      outfit_tryons: {
        Row: {
          id: string
          user_id: string
          top_image_url: string | null
          bottom_image_url: string | null
          result_image_url: string
          created_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          top_image_url?: string | null
          bottom_image_url?: string | null
          result_image_url: string
          created_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          top_image_url?: string | null
          bottom_image_url?: string | null
          result_image_url?: string
          created_at?: string
          metadata?: Json | null
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          items: Json
          total: number
          status: string
          shipping_address: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          items: Json
          total: number
          status: string
          shipping_address: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          items?: Json
          total?: number
          status?: string
          shipping_address?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      wardrobe_items: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          category: string
          type: string
          color: string | null
          size: string | null
          brand: string | null
          image_url: string | null
          source: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          category: string
          type: string
          color?: string | null
          size?: string | null
          brand?: string | null
          image_url?: string | null
          source?: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          category?: string
          type?: string
          color?: string | null
          size?: string | null
          brand?: string | null
          image_url?: string | null
          source?: string
          created_at?: string
          updated_at?: string | null
        }
      }
    }
  }
} 