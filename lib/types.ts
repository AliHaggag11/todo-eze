export interface Task {
  id: string;
  title: string;
  status: 'active' | 'completed';
}