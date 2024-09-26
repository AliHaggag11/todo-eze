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

  useEffect(() => {
    console.log('Setting up real-time subscription');
    const channel = supabase
      .channel('tasks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        console.log('Real-time update received:', payload);
        if (payload.eventType === 'INSERT') {
          console.log('Inserting new task');
          queryClient.setQueryData<Task[]>(['tasks'], (oldData) => {
            const newData = [...(oldData || []), payload.new as Task];
            console.log('Updated tasks after insert:', newData);
            return newData;
          });
          addTask(payload.new as Task);
        } else if (payload.eventType === 'UPDATE') {
          console.log('Updating task');
          queryClient.setQueryData<Task[]>(['tasks'], (oldData) => {
            const newData = oldData?.map(task => task.id === payload.new.id ? payload.new as Task : task) || [];
            console.log('Updated tasks after update:', newData);
            return newData;
          });
          updateTask(payload.new as Task);
        } else if (payload.eventType === 'DELETE') {
          console.log('Deleting task');
          queryClient.setQueryData<Task[]>(['tasks'], (oldData) => {
            const newData = oldData?.filter(task => task.id !== payload.old.id) || [];
            console.log('Updated tasks after delete:', newData);
            return newData;
          });
          deleteTask(payload.old.id);
        }
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Removing real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient, addTask, updateTask, deleteTask]);

  useEffect(() => {
    console.log('Tasks updated:', tasks);
  }, [tasks]);

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
      
      if (error) {
        console.error('Error adding task:', error)
        throw error
      }
      
      console.log('Task added successfully:', data)
      return data as Task
    },
    onMutate: async (newTaskTitle) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])
      const tempTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle,
        status: 'active',
        user_id: 'temp',
        created_at: new Date().toISOString()
      }
      queryClient.setQueryData<Task[]>(['tasks'], old => [...(old || []), tempTask])
      return { previousTasks }
    },
    onError: (err, newTask, context) => {
      queryClient.setQueryData(['tasks'], context?.previousTasks)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
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
    onMutate: async (updatedTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])
      queryClient.setQueryData<Task[]>(['tasks'], old => 
        old?.map(task => task.id === updatedTask.id ? updatedTask : task) || []
      )
      return { previousTasks }
    },
    onError: (err, updatedTask, context) => {
      queryClient.setQueryData(['tasks'], context?.previousTasks)
    },
    onSettled: () => {
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
    onMutate: async (deletedTaskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])
      queryClient.setQueryData<Task[]>(['tasks'], old => 
        old?.filter(task => task.id !== deletedTaskId) || []
      )
      return { previousTasks }
    },
    onError: (err, deletedTaskId, context) => {
      queryClient.setQueryData(['tasks'], context?.previousTasks)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
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