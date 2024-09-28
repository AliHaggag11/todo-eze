# Root Layout Component

## File
`app/layout.tsx`

## Purpose
This is the root layout component for the Next.js application.

## Key Features
1. Sets up the basic HTML structure.
2. Configures metadata for the application, including PWA settings.
3. Includes the Toaster component for notifications.
4. Manages the authentication state and renders the DotPattern background for logged-in users.
5. Registers the service worker for PWA functionality.

## Notes
- Uses the Inter font from Google Fonts.
- Sets viewport meta tag to prevent zooming on mobile devices.
- Includes the manifest link for PWA functionality.
- Uses Supabase for authentication state management.