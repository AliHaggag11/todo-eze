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

  useEffect(() => {
    const fetchTasks = async () => {
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
    };

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
  }, [userId, supabase]);

  const handleRealTimeUpdate = async (payload: any) => {
    console.log('Change received!', payload);
    if (payload.eventType === 'INSERT') {
      setTasks(currentTasks => [payload.new as Task, ...currentTasks]);
      await sendPushNotification('New Task Added', `Task: ${(payload.new as Task).title}`);
    } else if (payload.eventType === 'UPDATE') {
      setTasks(currentTasks =>
        currentTasks.map(task =>
          task.id === payload.new.id ? (payload.new as Task) : task
        )
      );
      if (payload.old.user_id !== userId) {
        await sendPushNotification('Task Updated', `Task "${(payload.new as Task).title}" was updated`);
      }
    } else if (payload.eventType === 'DELETE') {
      setTasks(currentTasks =>
        currentTasks.filter(task => task.id !== payload.old.id)
      );
      await sendPushNotification('Task Deleted', `A task has been deleted`);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.trim() && userId) {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ title: newTask.trim(), user_id: userId, priority: aiSuggestedPriority || 'medium' })
        .select()
        .single()
      if (error) {
        toast({ title: "Error", description: "Failed to add task. Please try again.", variant: "destructive" })
      } else {
        setNewTask('')
        setAiSuggestedPriority(null)
        await sendPushNotification('New Task Added', `Task: ${data.title}`)
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
    } else {
      sendPushNotification('Task Updated', `Task "${task.title}" marked as ${!task.is_complete ? 'complete' : 'incomplete'}`)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
    if (error) {
      toast({ title: "Error", description: "Failed to delete task. Please try again.", variant: "destructive" })
    } else {
      // Remove the task from the local state immediately
      setTasks(currentTasks => currentTasks.filter(task => task.id !== taskId));
      // The real-time update will handle the notification
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
    } else {
      sendPushNotification('Task Priority Updated', `A task priority has been updated to ${priority}`)
    }
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
            <Button 
              type="button" 
              onClick={getAISuggestion} 
              disabled={isAiLoading}
              className="flex-grow sm:flex-grow-0 bg-purple-500 hover:bg-purple-600"
            >
              {isAiLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 mr-1" />
              )}
              AI Suggest
            </Button>
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
    </div>
  )
}