import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Task } from '@/lib/types'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Database } from '@/lib/database.types'
import { useToast } from "@/hooks/use-toast"
import { PlusIcon, TrashIcon, PencilIcon, Loader2, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/app/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { RainbowButton } from '@/app/components/ui/rainbow-button'
import { TaskSummary } from '@/app/components/TaskSummary'

interface TodoListProps {
  pushSubscription: PushSubscription | null;
}

export default function TodoList({ pushSubscription }: TodoListProps) {
  const [newTask, setNewTask] = useState('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiSuggestedPriority, setAiSuggestedPriority] = useState<'low' | 'medium' | 'high' | null>(null)
  const supabase = createClientComponentClient<Database>()
  const { toast } = useToast()

  const sendPushNotification = useCallback(async (title: string, body: string) => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications are not supported in this browser');
      return;
    }

    if (pushSubscription) {
      try {
        console.log('Attempting to send push notification', { title, body });
        console.log('Push subscription:', JSON.stringify(pushSubscription));
        
        const response = await fetch('/api/send-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription: pushSubscription,
            title,
            body,
            url: window.location.origin,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Push notification request failed:', response.status, errorText);
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const result = await response.json();
        console.log('Push notification sent successfully:', result);
      } catch (error) {
        console.error('Error sending push notification:', error);
        toast({ 
          title: "Notification Error", 
          description: "Failed to send push notification. Please try again.", 
          variant: "destructive" 
        });
      }
    } else if (Notification.permission === 'denied') {
      console.log('Push notifications are blocked by the user');
    } else {
      console.log('Push subscription not available');
    }
  }, [pushSubscription, toast]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        console.log('User ID set:', user.id)
      } else {
        console.log('No user found')
      }
    }
    fetchUser()
  }, [supabase.auth])

  const handleRealTimeUpdate = useCallback(async (payload: any) => {
    console.log('Real-time update received:', payload);
    if (payload.eventType === 'INSERT') {
      console.log('Inserting new task:', payload.new);
      setTasks(currentTasks => [payload.new as Task, ...currentTasks]);
      await sendPushNotification('New Task Added', `Task: ${(payload.new as Task).title}`);
    } else if (payload.eventType === 'UPDATE') {
      console.log('Updating task:', payload.new);
      setTasks(currentTasks =>
        currentTasks.map(task =>
          task.id === payload.new.id ? (payload.new as Task) : task
        )
      );
      await sendPushNotification('Task Updated', `Task "${(payload.new as Task).title}" was updated`);
    } else if (payload.eventType === 'DELETE') {
      console.log('Deleting task:', payload.old);
      setTasks(currentTasks => 
        currentTasks.filter(task => task.id !== payload.old.id)
      );
      await sendPushNotification('Task Deleted', `A task has been deleted`);
    }
  }, [sendPushNotification]);

  const fetchTasks = useCallback(async () => {
    if (!userId) {
      console.log('No userId, skipping task fetch');
      return;
    }

    setIsLoading(true);
    console.log('Fetching tasks for user:', userId);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Fetched tasks:', data);
      setTasks(data as Task[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({ title: "Error", description: "Failed to fetch tasks. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      console.log('Task fetching complete');
    }
  }, [userId, supabase, toast]);

  useEffect(() => {
    if (userId) {
      fetchTasks();

      const channel = supabase
        .channel('tasks_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
          handleRealTimeUpdate
        )
        .subscribe();

      return () => {
        console.log('Cleaning up subscription');
        supabase.removeChannel(channel);
      };
    }
  }, [userId, supabase, handleRealTimeUpdate, fetchTasks]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.trim() && userId) {
      const { error } = await supabase
        .from('tasks')
        .insert({ title: newTask.trim(), user_id: userId, priority: aiSuggestedPriority || 'medium' })
      if (error) {
        toast({ title: "Error", description: "Failed to add task. Please try again.", variant: "destructive" })
      } else {
        setNewTask('')
        setAiSuggestedPriority(null)
        // The real-time subscription will handle updating the UI
      }
    }
  }

  const handleToggleTask = async (task: Task) => {
    const updatedTask = { ...task, is_complete: !task.is_complete };
    const { error } = await supabase
      .from('tasks')
      .update(updatedTask)
      .eq('id', task.id)
    if (error) {
      toast({ title: "Error", description: "Failed to update task. Please try again.", variant: "destructive" })
    }
    // The real-time subscription will handle updating the UI
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      console.log('Attempting to delete task:', taskId);
      
      // Optimistically update UI
      setTasks(currentTasks => currentTasks.filter(task => task.id !== taskId));

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        throw error;
      }

      console.log('Task deleted successfully:', taskId);
      // No need to update state here, as we've already updated it optimistically
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({ title: "Error", description: "Failed to delete task. Please try again.", variant: "destructive" });
      // If there's an error, revert the optimistic update
      fetchTasks();
    }
  };

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
        // The real-time subscription will handle updating the UI
      }
    }
  }

  const getAISuggestion = async () => {
    setIsAiLoading(true)
    try {
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: tasks.map(t => `${t.title} (${t.priority})`).join(", ") })
      });
      const data = await response.json();
      if (data.result) {
        const [taskTitle, priorityPart] = data.result.split('|');
        const suggestedPriority = priorityPart.split(':')[1].trim().toLowerCase();
        setNewTask(taskTitle.split(':')[1].trim());
        setAiSuggestedPriority(suggestedPriority as 'low' | 'medium' | 'high');
      }
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      toast({ title: "Error", description: "Failed to get AI suggestion. Please try again.", variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleUpdateTaskPriority = async (taskId: string, priority: 'low' | 'medium' | 'high') => {
    const { error } = await supabase
      .from('tasks')
      .update({ priority })
      .eq('id', taskId)
    if (error) {
      toast({ title: "Error", description: "Failed to update task priority.", variant: "destructive" })
    }
    // The real-time subscription will handle updating the UI
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        <span className="ml-2">Loading tasks...</span>
      </div>
    )
  }

  console.log('Rendering TodoList with tasks:', tasks);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <form onSubmit={handleAddTask} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task"
            className="flex-grow"
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-grow sm:flex-grow-0">
              <PlusIcon className="w-5 h-5 mr-1" /> Add
            </Button>
            <RainbowButton
              type="button"
              onClick={getAISuggestion}
              disabled={isAiLoading}
              className="flex-grow sm:flex-grow-0"
            >
              {isAiLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-1" />
                  AI Suggest
                </>
              )}
            </RainbowButton>
          </div>
        </div>
      </form>
      
      {tasks.length === 0 ? (
        <p className="text-center text-gray-700 dark:text-gray-300 mt-6">No tasks yet. Add one to get started!</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className="bg-gray-100 dark:bg-gray-700 rounded-md transition-all hover:shadow-md">
              <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-start flex-grow min-w-0">
                  <input
                    type="checkbox"
                    checked={task.is_complete}
                    onChange={() => handleToggleTask(task)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                  />
                  <span className={`${
                    task.is_complete ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'
                  } text-lg ml-3 break-words`}>
                    {task.title}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                  <Select
                    value={task.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high') => handleUpdateTaskPriority(task.id, value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => handleEditTask(task)}
                        variant="outline"
                        size="icon"
                        className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white dark:bg-gray-800 rounded-lg sm:max-w-[425px] max-w-[calc(100%-2rem)] mx-auto">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Task</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdateTask}>
                        <Input
                          value={editingTask?.title || ''}
                          onChange={(e) => setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)}
                          className="mb-4 text-gray-900 dark:text-gray-100 placeholder-gray-600 dark:placeholder-gray-400 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        />
                        <DialogClose asChild>
                          <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white">Update Task</Button>
                        </DialogClose>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button
                    onClick={() => handleDeleteTask(task.id)}
                    variant="destructive"
                    size="icon"
                    className="hover:bg-red-600"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {userId && <TaskSummary userId={userId} />}
    </div>
  )
}