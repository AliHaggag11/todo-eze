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
} from "@/app/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export default function TodoList() {
  const [newTask, setNewTask] = useState('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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
      setIsDialogOpen(false)
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
    setIsDialogOpen(true)
  }

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTask) {
      try {
        await updateTaskMutation.mutateAsync(editingTask)
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
    <div className="max-w-md mx-auto">
      <form onSubmit={handleAddTask} className="mb-4 flex">
        <Input
          type="text"
          value={newTask}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTask(e.target.value)}
          placeholder="Add a new task"
          className="mr-2 flex-grow"
        />
        <Button type="submit">Add Task</Button>
      </form>
      <ul>
        {tasks.map((task: Task) => (
          <li key={task.id} className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={task.status === 'completed'}
              onChange={() => handleToggleTask(task)}
              className="mr-2"
            />
            <span className={task.status === 'completed' ? 'line-through' : ''}>
              {task.title}
            </span>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleEditTask(task)} className="ml-auto mr-2" variant="outline">
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background border-border">
                <DialogHeader>
                  <DialogTitle>Edit Task</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateTask} className="mt-4">
                  <Input
                    type="text"
                    value={editingTask?.title || ''}
                    onChange={(e) => setEditingTask(prev => prev ? {...prev, title: e.target.value} : null)}
                    className="mb-4"
                  />
                  <Button type="submit">Update Task</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button
              onClick={() => handleDeleteTask(task.id)}
              variant="destructive"
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}