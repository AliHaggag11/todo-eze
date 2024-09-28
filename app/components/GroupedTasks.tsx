import React from 'react';
import { Task } from '@/lib/types';
import { Button } from '@/app/components/ui/button';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";

interface GroupedTasksProps {
  groupedTasks: Record<string, string[]>;
  tasks: Task[];
  onToggleTask: (task: Task) => void;
  onUpdateTaskPriority: (taskId: string, priority: 'low' | 'medium' | 'high') => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (e: React.FormEvent, task: Task) => void;
}

const GroupedTasks: React.FC<GroupedTasksProps> = ({
  groupedTasks,
  tasks,
  onToggleTask,
  onUpdateTaskPriority,
  onEditTask,
  onDeleteTask,
  onUpdateTask
}) => {
  return (
    <div className="space-y-6">
      {Object.entries(groupedTasks).map(([category, taskIds]) => {
        const categoryTasks = taskIds.map(id => tasks.find(t => t.id === id)).filter(Boolean) as Task[];
        if (categoryTasks.length === 0) return null; // Don't render empty categories
        return (
          <div key={category} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-3">{category}</h3>
            <ul className="space-y-3">
              {categoryTasks.map(task => (
                <li key={task.id} className="bg-white dark:bg-gray-600 rounded-md transition-all hover:shadow-md">
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-start flex-grow min-w-0">
                      <input
                        type="checkbox"
                        checked={task.is_complete}
                        onChange={() => onToggleTask(task)}
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
                        onValueChange={(value: 'low' | 'medium' | 'high') => onUpdateTaskPriority(task.id, value)}
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
                            onClick={() => onEditTask(task)}
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
                          <form onSubmit={(e) => onUpdateTask(e, task)}>
                            <Input
                              value={task.title}
                              onChange={(e) => onEditTask({ ...task, title: e.target.value })}
                              className="mb-4 text-gray-900 dark:text-gray-100 placeholder-gray-600 dark:placeholder-gray-400 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                            />
                            <DialogClose asChild>
                              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white">Update Task</Button>
                            </DialogClose>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button
                        onClick={() => onDeleteTask(task.id)}
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
          </div>
        );
      })}
    </div>
  );
};

export default GroupedTasks;