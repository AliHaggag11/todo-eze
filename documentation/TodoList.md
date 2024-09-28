# TodoList Component

## File
`app/components/TodoList.tsx`

## Purpose
This component manages the display and interaction with the todo list.

## Key Features
1. Fetches and displays tasks from Supabase.
2. Allows adding, editing, completing, and deleting tasks.
3. Implements real-time updates using Supabase's real-time subscriptions.
4. Handles push notifications for task changes.
5. Implements loading state with a spinner.

## Important Functions
- `sendPushNotification()`: Sends push notifications for task changes.
- `handleAddTask()`: Adds a new task.
- `handleToggleTask()`: Toggles a task's completion status.
- `handleEditTask()`: Opens the edit dialog for a task.
- `handleUpdateTask()`: Updates an existing task.
- `handleDeleteTask()`: Deletes a task.

## Notes
- Uses Supabase for real-time database operations.
- Implements optimistic updates for better user experience.
- Uses shadcn/ui components for consistent styling.
- Handles push notifications with proper browser support checks.