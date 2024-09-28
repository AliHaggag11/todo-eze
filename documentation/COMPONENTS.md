# Components

## Main Components

1. **TodoList**
   - Purpose: Displays and manages the list of tasks
   - Props: `pushSubscription: PushSubscription | null`
   - Key Functions:
     - `handleAddTask`: Adds a new task
     - `handleToggleTask`: Toggles task completion status
     - `handleDeleteTask`: Deletes a task
     - `handleEditTask`: Opens edit dialog for a task
     - `handleUpdateTask`: Updates an existing task

2. **Auth**
   - Purpose: Handles user authentication
   - Key Functions:
     - `handleLogin`: Initiates GitHub OAuth login

3. **Layout**
   - Purpose: Provides the overall layout structure
   - Features:
     - Manages service worker registration
     - Handles dark mode toggle
     - Renders DotPattern background for logged-in users

## UI Components

- Button
- Input
- Dialog (and related components)
- Toaster

## Custom Components

- Ripple: Provides a ripple animation effect
- DotPattern: Renders a decorative dot pattern background

## Pages

- Home (`app/page.tsx`): Main page component
  - Manages user session
  - Handles push notification subscription
  - Renders either Auth or TodoList based on session state