export interface Task {
  id: string;
  created_at: string;
  title: string;
  status: 'active' | 'completed';
  user_id: string;
}