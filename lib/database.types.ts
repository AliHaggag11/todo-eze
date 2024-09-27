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
      tasks: {
        Row: {
          id: string
          created_at: string
          title: string
          status: 'active' | 'completed'
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          status?: 'active' | 'completed'
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          status?: 'active' | 'completed'
          user_id?: string
        }
      }
    }
    // ... (remove other tables if they no longer exist)
  }
}