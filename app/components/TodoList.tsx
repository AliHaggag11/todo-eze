import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Task } from '@/lib/types'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Database } from '@/lib/database.types'
import { useToast } from "@/hooks/use-toast"
import { PlusIcon, TrashIcon } from 'lucide-react'
import { useUser } from '@supabase/auth-helpers-react'

export default function TodoList() {
  const [newTask, setNewTask] = useState('')
  const queryClient = useQueryClient()
  const supabase = createClientComponentClient<Database>()
  const { toast } = useToast()
  const user = useUser()

  const fetchTasks = async () => {
    if (!user?.id) return []
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  }

  const { data: tasks, isLoading, error } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    enabled: !!user,
  })

  const addTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      if (!user) throw new Error('No user found')
      const { data, error } = await supabase
        .from('tasks')
        .insert({ title, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({ title: "Task added", description: "Your task has been added successfully." })
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add task. Please try again.", variant: "destructive" })
    },
  })

  const toggleTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ is_complete: !task.is_complete })
        .eq('id', task.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update task. Please try again.", variant: "destructive" })
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({ title: "Task deleted", description: "Your task has been deleted successfully." })
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete task. Please try again.", variant: "destructive" })
    },
  })

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.trim()) {
      await addTaskMutation.mutateAsync(newTask.trim())
      setNewTask('')
    }
  }

  if (isLoading) return <div>Loading tasks...</div>
  if (error) return <div>Error loading tasks: {error.message}</div>

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <form onSubmit={handleAddTask} className="mb-6">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task"
            className="flex-grow"
          />
          <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
            <PlusIcon className="w-5 h-5 mr-1" /> Add
          </Button>
        </div>
      </form>
      <ul className="space-y-3">
        {tasks?.map((task) => (
          <li key={task.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={task.is_complete}
                onChange={() => toggleTaskMutation.mutate(task)}
                className="w-5 h-5"
              />
              <span className={task.is_complete ? 'line-through text-gray-500' : ''}>
                {task.title}
              </span>
            </div>
            <Button
              onClick={() => deleteTaskMutation.mutate(task.id)}
              variant="destructive"
              size="sm"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </li>
        ))}
      </ul>
      {tasks?.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-6">No tasks yet. Add one to get started!</p>
      )}
    </div>
  )
}