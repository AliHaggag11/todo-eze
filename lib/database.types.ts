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
          user_id: string
          title: string
          is_complete: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          is_complete?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          is_complete?: boolean
          created_at?: string
        }
      }
    }
  }
}