# Service Worker

## File
`public/service-worker.js`

## Purpose
This is the Service Worker file for PWA functionality.

## Key Features
1. Defines a cache name and list of URLs to cache.
2. Implements the install event to cache specified resources.
3. Implements the fetch event to serve cached resources when offline.
4. Handles push events for notifications.
5. Manages notification click events.

## Notes
- Critical for offline functionality and improved performance.
- Make sure to update the CACHE_NAME and urlsToCache when making significant changes to the app.
- Implements push notification handling for the PWA.