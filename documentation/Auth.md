# Auth Component

## File
`app/components/Auth.tsx`

## Purpose
This component handles user authentication using GitHub OAuth via Supabase.

## Key Features
1. Displays a login button for GitHub authentication.
2. Handles loading state during authentication.
3. Displays error messages if authentication fails.
4. Uses the Ripple component for a visually appealing background effect.

## Important Functions
- `handleLogin()`: Initiates the OAuth flow with GitHub.

## Notes
- This component is rendered when there's no active session.
- It uses Supabase's createClientComponentClient for authentication.