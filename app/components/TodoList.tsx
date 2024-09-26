import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useTodoStore } from '@/lib/store'
import { Task } from '@/lib/types'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Database } from '@/lib/database.types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/app/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { PlusIcon, EditIcon, TrashIcon, CheckIcon, XIcon } from 'lucide-react'

export default function TodoList() {
  const [newTask, setNewTask] = useState('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const { tasks, setTasks } = useTodoStore()
  const queryClient = useQueryClient()
  const supabase = createClientComponentClient<Database>()
  const { toast } = useToast()

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase.from('tasks').select('*')
    if (error) throw error
    return data as Task[]
  }, [supabase])

  const { data, isLoading, error: fetchError } = useQuery<Task[], Error>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  useEffect(() => {
    if (data) {
      setTasks(data)
    }
  }, [data, setTasks])

  useEffect(() => {
    const channel = supabase
      .channel('table-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        console.log('Real-time update received:', payload)
        fetchTasks().then(setTasks)
      })
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, setTasks, fetchTasks])

  const addTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')
      
      const newTask = { title, status: 'active' as const, user_id: user.id }
      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single()
      
      if (error) throw error
      return data as Task
    },
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: "Task added",
        description: `"${newTask.title}" has been added to your list.`,
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add task. Please try again.",
        variant: "destructive",
      })
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(task)
        .eq('id', task.id)
        .select()
        .single()
      if (error) throw error
      return data as Task
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setEditingTask(null)
      toast({
        title: "Task updated",
        description: `"${updatedTask.title}" has been updated.`,
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      })
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
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      const deletedTask = tasks.find(task => task.id === taskId)
      toast({
        title: "Task deleted",
        description: deletedTask ? `"${deletedTask.title}" has been deleted.` : "Task has been deleted.",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      })
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

  const handleToggleTask = (task: Task) => {
    const newStatus = task.status === 'completed' ? 'active' : 'completed'
    updateTaskMutation.mutate({ ...task, status: newStatus })
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
  }

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTask) {
      try {
        await updateTaskMutation.mutateAsync(editingTask)
        // The dialog will be closed automatically due to the DialogClose component
      } catch (error) {
        console.error('Error in handleUpdateTask:', error)
      }
    }
  }

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId)
  }

  if (isLoading) return <div>Loading tasks...</div>
  if (fetchError) return <div>Error loading tasks: {fetchError.message}</div>

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <form onSubmit={handleAddTask} className="mb-6">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            value={newTask}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTask(e.target.value)}
            placeholder="Add a new task"
            className="flex-grow text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
            <PlusIcon className="w-5 h-5 mr-1" /> Add
          </Button>
        </div>
      </form>
      <ul className="space-y-3">
        {tasks.map((task: Task) => (
          <li key={task.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-md transition-all hover:shadow-md">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={task.status === 'completed'}
                onChange={() => handleToggleTask(task)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className={`text-lg ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-800 dark:text-white'}`}>
                {task.title}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button onClick={() => handleEditTask(task)} variant="outline" size="sm" className="text-gray-700 dark:text-gray-300">
                    <EditIcon className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg max-w-md w-full mx-auto">
                  <DialogClose className="absolute right-4 top-4 rounded-full p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <XIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    <span className="sr-only">Close</span>
                  </DialogClose>
                  <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">Edit Task</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpdateTask} className="space-y-4">
                    <Input
                      type="text"
                      value={editingTask?.title || ''}
                      onChange={(e) => setEditingTask(prev => prev ? {...prev, title: e.target.value} : null)}
                      className="w-full text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                    />
                    <DialogClose asChild>
                      <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-md py-2 transition duration-200 ease-in-out">
                        <CheckIcon className="w-4 h-4 mr-2" /> Update Task
                      </Button>
                    </DialogClose>
                  </form>
                </DialogContent>
              </Dialog>
              <Button
                onClick={() => handleDeleteTask(task.id)}
                variant="destructive"
                size="sm"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {tasks.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-6">No tasks yet. Add one to get started!</p>
      )}
    </div>
  )
}