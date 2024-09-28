import { useState, useEffect } from 'react'
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

  useEffect(() => {
    if (userId) {
      const fetchTasks = async () => {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) {
          console.error('Error fetching tasks:', error)
          return
        }
        setTasks(data as Task[])
      }

      fetchTasks()

      const channel = supabase
        .channel('tasks_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'tasks' },
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

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [userId, supabase])

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.trim() && userId) {
      const { error } = await supabase
        .from('tasks')
        .insert({ title: newTask.trim(), user_id: userId })
      if (error) {
        toast({ title: "Error", description: "Failed to add task. Please try again.", variant: "destructive" })
      } else {
        setNewTask('')
      }
    }
  }

  const handleToggleTask = async (task: Task) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_complete: !task.is_complete })
      .eq('id', task.id)
    if (error) {
      toast({ title: "Error", description: "Failed to update task. Please try again.", variant: "destructive" })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
    if (error) {
      toast({ title: "Error", description: "Failed to delete task. Please try again.", variant: "destructive" })
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
  }

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTask) {
      const { error } = await supabase
        .from('tasks')
        .update({ title: editingTask.title })
        .eq('id', editingTask.id)
      if (error) {
        toast({ title: "Error", description: "Failed to update task. Please try again.", variant: "destructive" })
      } else {
        setEditingTask(null)
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Collaborative Todo List</h1>
        <Button variant="outline" onClick={() => {/* Add logout logic here */}}>
          Logout
        </Button>
      </header>
      
      <form onSubmit={handleAddTask} className="mb-6">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task"
            className="flex-grow text-gray-800 dark:text-gray-200 placeholder-gray-600 dark:placeholder-gray-400"
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
                onChange={() => handleToggleTask(task)}
                className="w-5 h-5"
              />
              <span className={`${task.is_complete ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                {task.title}
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
                <DialogContent className="bg-white dark:bg-gray-800 rounded-lg sm:max-w-[425px] max-w-[calc(100%-2rem)] mx-auto">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-gray-100">Edit Task</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpdateTask}>
                    <Input
                      value={editingTask?.title || ''}
                      onChange={(e) => setEditingTask(prev => prev ? {...prev, title: e.target.value} : null)}
                      className="mb-4 text-gray-900 dark:text-gray-100 placeholder-gray-600 dark:placeholder-gray-400"
                    />
                    <DialogClose asChild>
                      <Button type="submit" className="w-full">Update Task</Button>
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
        <p className="text-center text-gray-700 dark:text-gray-300 mt-6">No tasks yet. Add one to get started!</p>
      )}
    </div>
  )
}