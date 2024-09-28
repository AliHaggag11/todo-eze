import React from 'react';
import { Task } from '@/lib/types';
import { Button } from '@/app/components/ui/button';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

interface GroupedTasksProps {
  groupedTasks: Record<string, number[]>;
  tasks: Task[];
  onToggleTask: (task: Task) => void;
  onUpdateTaskPriority: (taskId: string, priority: 'low' | 'medium' | 'high') => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const GroupedTasks: React.FC<GroupedTasksProps> = ({
  groupedTasks,
  tasks,
  onToggleTask,
  onUpdateTaskPriority,
  onEditTask,
  onDeleteTask
}) => {
  return (
    <div className="space-y-6">
      {Object.entries(groupedTasks).map(([category, indices]) => (
        <div key={category} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-xl font-semibold mb-3">{category}</h3>
          <ul className="space-y-2">
            {indices.map(index => {
              const task = tasks[index];
              return (
                <li key={task.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded-md">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={task.is_complete}
                      onChange={() => onToggleTask(task)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={task.is_complete ? 'line-through text-gray-500' : ''}>{task.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={task.priority}
                      onValueChange={(value: 'low' | 'medium' | 'high') => onUpdateTaskPriority(task.id, value)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => onEditTask(task)}
                      variant="outline"
                      size="icon"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => onDeleteTask(task.id)}
                      variant="destructive"
                      size="icon"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default GroupedTasks;