# Home Page Component

## File
`app/page.tsx`

## Purpose
This is the main page component of the application.

## Key Features
1. Manages user session state.
2. Renders either the Auth component or the TodoList component based on session status.
3. Provides logout functionality.
4. Wraps the application with QueryClientProvider for React Query.
5. Handles push notification subscription and toggle.

## Important Functions
- `handleLogout()`: Logs out the current user.
- `handlePushNotificationToggle()`: Toggles push notification subscription.
- `checkPushNotificationStatus()`: Checks the current status of push notifications.

## Notes
- Uses the 'use client' directive for client-side rendering.
- Implements push notification functionality with feature detection.
- Updates the greeting based on the time of day.