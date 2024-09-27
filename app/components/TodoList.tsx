import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Task } from '@/lib/types'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Database } from '@/lib/database.types'
import { useToast } from "@/hooks/use-toast"
import { PlusIcon, TrashIcon } from 'lucide-react'

export default function TodoList() {
  const [newTask, setNewTask] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const supabase = createClientComponentClient<Database>()
  const { toast } = useToast()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Fetched user:', user)
      setUserId(user?.id || null)
    }
    fetchUser()
  }, [supabase.auth])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Change received!', payload)
          queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId, queryClient])

  const fetchTasks = async () => {
    if (!userId) {
      console.log('No user ID available for fetching tasks')
      return []
    }
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching tasks:', error)
      throw error
    }
    return data
  }

  const { data: tasks, isLoading, error } = useQuery<Task[]>({
    queryKey: ['tasks', userId],
    queryFn: fetchTasks,
    enabled: !!userId,
  })

  const addTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      if (!userId) {
        console.error('No user ID available when adding task')
        throw new Error('No user found')
      }
      console.log('Adding task for user:', userId)
      const { data, error } = await supabase
        .from('tasks')
        .insert({ title, user_id: userId })
        .select()
        .single()
      if (error) {
        console.error('Error adding task:', error)
        throw error
      }
      return data
    },
    onSuccess: () => {
      toast({ title: "Task added", description: "Your task has been added successfully." })
    },
    onError: (error) => {
      console.error('Error in addTaskMutation:', error)
      toast({ title: "Error", description: `Failed to add task: ${error.message}`, variant: "destructive" })
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
      toast({ title: "Task deleted", description: "Your task has been deleted successfully." })
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete task. Please try again.", variant: "destructive" })
    },
  })

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.trim()) {
      try {
        await addTaskMutation.mutateAsync(newTask.trim())
        setNewTask('')
      } catch (error) {
        console.error('Error in handleAddTask:', error)
      }
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
            className="flex-grow text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
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
              <span className={`${task.is_complete ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
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
        <p className="text-center text-gray-600 dark:text-gray-300 mt-6">No tasks yet. Add one to get started!</p>
      )}
    </div>
  )
}