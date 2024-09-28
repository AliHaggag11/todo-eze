# Deployment Guide

## Prerequisites

- Supabase account and project set up
- Vercel, Netlify, or similar platform account

## Steps

1. Push your code to a GitHub repository

2. Connect your deployment platform to the GitHub repository

3. Set up environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`

4. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `.next`

5. Deploy the application

6. Set up a custom domain (optional)

7. Enable HTTPS

8. Test the deployed application:
   - User authentication
   - Real-time updates
   - Push notifications

## Troubleshooting

- Check deployment logs for any build errors
- Verify environment variables are correctly set
- Ensure Supabase project is on the correct plan for your needs
- Test service worker and push notifications in production environment

## Updating

To update your deployed application:

1. Push changes to your GitHub repository
2. Your deployment platform should automatically trigger a new build and deployment

Always test thoroughly in a staging environment before deploying to production.