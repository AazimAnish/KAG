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
    }
  }
} 