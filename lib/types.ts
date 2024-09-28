export interface Task {
  id: string;
  title: string;
  is_complete: boolean;
  user_id: string;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
}