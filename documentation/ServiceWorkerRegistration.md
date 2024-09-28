# Service Worker Registration

## File
`app/layout.tsx` (Integrated in the layout component)

## Purpose
This functionality registers the service worker for PWA capabilities.

## Key Features
1. Checks if service workers are supported by the browser.
2. Registers the service worker file (service-worker.js) when the component mounts.

## Notes
- This functionality is integrated into the layout component.
- It doesn't render anything visible, it only performs the registration.
- Console logs the registration status for debugging purposes.