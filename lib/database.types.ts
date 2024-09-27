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
          assigned_to: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          status?: 'active' | 'completed'
          user_id: string
          assigned_to?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          status?: 'active' | 'completed'
          user_id?: string
          assigned_to?: string | null
        }
      }
      user_roles: {
        Row: {
          user_id: string
          task_id: string
          role: 'owner' | 'editor' | 'viewer'
        }
        Insert: {
          user_id: string
          task_id: string
          role: 'owner' | 'editor' | 'viewer'
        }
        Update: {
          user_id?: string
          task_id?: string
          role?: 'owner' | 'editor' | 'viewer'
        }
      }
      users: {
        Row: {
          id: string
          email: string
        }
        Insert: {
          id: string
          email: string
        }
        Update: {
          id?: string
          email?: string
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          subscription: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}