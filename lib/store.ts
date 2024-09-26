import { create } from 'zustand'
import { Task } from '@/lib'

interface TodoStore {
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (task: Task) => void
  deleteTask: (taskId: string) => void
}

export const useTodoStore = create<TodoStore>((set) => ({
  tasks: [],
  setTasks: (tasks) => set((state) => {
    console.log('Setting tasks:', tasks);
    return { tasks };
  }),
  addTask: (task) => set((state) => {
    console.log('Adding task:', task);
    return { tasks: [...state.tasks, task] };
  }),
  updateTask: (updatedTask) => set((state) => {
    console.log('Updating task:', updatedTask);
    return {
      tasks: state.tasks.map((task) =>
        task.id === updatedTask.id ? updatedTask : task
      ),
    };
  }),
  deleteTask: (taskId) => set((state) => {
    console.log('Deleting task:', taskId);
    return {
      tasks: state.tasks.filter((task) => task.id !== taskId),
    };
  }),
}))