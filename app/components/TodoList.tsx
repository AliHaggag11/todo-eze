import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useTodoStore } from '@/lib/store'
import { Task } from '@/lib/types'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Database } from '@/lib/database.types'

export default function TodoList() {
  const [newTask, setNewTask] = useState('')
  const { tasks, setTasks, addTask, updateTask, deleteTask } = useTodoStore()
  const queryClient = useQueryClient()
  const supabase = createClientComponentClient<Database>()

  const { data, isLoading, error } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks').select('*')
      if (error) {
        console.error('Error fetching tasks:', error)
        throw error
      }
      console.log('Fetched tasks:', data)
      return data as Task[]
    },
  })

  useEffect(() => {
    if (data) {
      setTasks(data)
    }
  }, [data, setTasks])

  const addTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')
      
      console.log('Attempting to add task:', { title, user_id: user.id })
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({ title, status: 'active', user_id: user.id })
        .select()
        .single()
      
      if (error) {
        console.error('Error adding task:', error)
        throw error
      }
      
      console.log('Task added successfully:', data)
      return data as Task
    },
    onSuccess: (newTask) => {
      console.log('onSuccess called with:', newTask)
      addTask(newTask)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => {
      console.error('Error in addTaskMutation:', error)
      // You might want to show an error message to the user here
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
      updateTask(updatedTask)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
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
      deleteTask(taskId)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.trim()) {
      console.log('Attempting to add task:', newTask)
      try {
        const result = await addTaskMutation.mutateAsync(newTask.trim())
        console.log('Task added:', result)
        setNewTask('')
      } catch (error) {
        console.error('Error in handleAddTask:', error)
        // You might want to show an error message to the user here
      }
    }
  }

  const handleToggleTask = (task: Task) => {
    updateTaskMutation.mutate({ ...task, status: task.status === 'completed' ? 'active' : 'completed' })
  }

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId)
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {(error as Error).message}</div>

  return (
    <div className="max-w-md mx-auto mt-8">
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
            <Button
              onClick={() => handleDeleteTask(task.id)}
              className="ml-auto"
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