import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Task } from '@/lib/types'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Database } from '@/lib/database.types'
import { useToast } from "@/hooks/use-toast"
import { PlusIcon, TrashIcon, PencilIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/app/components/ui/dialog"

export default function TodoList() {
  const [newTask, setNewTask] = useState('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const supabase = createClientComponentClient<Database>()
  const { toast } = useToast()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    fetchUser()
  }, [supabase.auth])

  const fetchTasks = async () => {
    if (!userId) return []
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Task[]
  }

  useEffect(() => {
    if (userId) {
      fetchTasks().then(fetchedTasks => setTasks(fetchedTasks))

      // Set up real-time subscription
      const subscription = supabase
        .channel('tasks_changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'tasks',
            filter: `user_id=eq.${userId}`
          }, 
          (payload) => {
            console.log('Change received!', payload)
            if (payload.eventType === 'INSERT') {
              setTasks(currentTasks => [payload.new as Task, ...currentTasks])
            } else if (payload.eventType === 'UPDATE') {
              setTasks(currentTasks => 
                currentTasks.map(task => 
                  task.id === payload.new.id ? (payload.new as Task) : task
                )
              )
            } else if (payload.eventType === 'DELETE') {
              setTasks(currentTasks => 
                currentTasks.filter(task => task.id !== payload.old.id)
              )
            }
          }
        )
        .subscribe()

      // Cleanup subscription on component unmount
      return () => {
        subscription.unsubscribe()
      }
    }
  }, [userId, supabase])

  const addTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      if (!userId) throw new Error('No user found')
      const { data, error } = await supabase
        .from('tasks')
        .insert({ title, user_id: userId })
        .select()
        .single()
      if (error) throw error
      return data as Task
    },
    onSuccess: (newTask) => {
      setTasks(currentTasks => [newTask, ...currentTasks])
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
      return data as Task
    },
    onSuccess: (updatedTask) => {
      setTasks(currentTasks => 
        currentTasks.map(task => task.id === updatedTask.id ? updatedTask : task)
      )
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
    onSuccess: (_, deletedTaskId) => {
      setTasks(currentTasks => currentTasks.filter(task => task.id !== deletedTaskId))
      toast({ title: "Task deleted", description: "Your task has been deleted successfully." })
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete task. Please try again.", variant: "destructive" })
    },
  })

  const editTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ title: task.title })
        .eq('id', task.id)
        .select()
        .single()
      if (error) throw error
      return data as Task
    },
    onSuccess: (updatedTask) => {
      setTasks(currentTasks => 
        currentTasks.map(task => task.id === updatedTask.id ? updatedTask : task)
      )
      setEditingTask(null) // Reset editing task
      toast({ title: "Task updated", description: "Your task has been updated successfully." })
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update task. Please try again.", variant: "destructive" })
    },
  })

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.trim()) {
      await addTaskMutation.mutateAsync(newTask.trim())
      setNewTask('')
      // No need to update tasks state here, it will be handled by the real-time subscription
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
  }

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTask) {
      await editTaskMutation.mutateAsync(editingTask)
      // No need to update tasks state or setEditingTask(null) here, it will be handled by the real-time subscription
    }
  }

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
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={task.is_complete}
                onChange={() => toggleTaskMutation.mutate(task)}
                className="w-5 h-5"
              />
              <span className={`${task.is_complete ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                {editingTask && editingTask.id === task.id ? editingTask.title : task.title}
              </span>
            </div>
            <div className="flex space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => handleEditTask(task)}
                    variant="outline"
                    size="sm"
                    className="bg-gray-200 dark:bg-gray-600"
                  >
                    <PencilIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-gray-800">
                  <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpdateTask}>
                    <Input
                      value={editingTask?.title || ''}
                      onChange={(e) => setEditingTask(prev => prev ? {...prev, title: e.target.value} : null)}
                      className="mb-4"
                    />
                    <DialogClose asChild>
                      <Button type="submit">Update Task</Button>
                    </DialogClose>
                  </form>
                </DialogContent>
              </Dialog>
              <Button
                onClick={() => deleteTaskMutation.mutate(task.id)}
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
        <p className="text-center text-gray-600 dark:text-gray-300 mt-6">No tasks yet. Add one to get started!</p>
      )}
    </div>
  )
}