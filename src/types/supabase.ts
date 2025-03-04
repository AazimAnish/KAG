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
    }
  }
} 