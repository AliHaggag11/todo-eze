# Push Notifications

## Setup

1. Generate VAPID keys:
   ```
   npx web-push generate-vapid-keys
   ```

2. Add VAPID keys to `.env.local`:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
   VAPID_PRIVATE_KEY=your_private_key
   ```

3. Implement service worker (`public/service-worker.js`)

4. Register service worker in `app/layout.tsx`

5. Implement push subscription logic in `app/page.tsx`

6. Create API route for sending notifications (`app/api/send-notification/route.ts`)

## Usage

1. User enables notifications through the UI
2. Subscription is saved to Supabase
3. When a task is added/updated/deleted, a notification is sent to all subscribed users
4. Service worker handles incoming push events and displays notifications

## Troubleshooting

- Ensure VAPID keys are correctly set in environment variables
- Check browser console for subscription errors
- Verify that the service worker is registered and active
- Test notifications in different browsers and devices