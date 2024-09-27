export interface Task {
  id: string;
  created_at: string;
  title: string;
  status: 'active' | 'completed';
  user_id: string;
  created_by: string;
  assigned_to: string | null;
  user_roles: { role: 'owner' | 'editor' | 'viewer' }[];
}