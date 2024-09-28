# Architecture

## Overview

This application is built using a modern web stack with Next.js as the core framework. It leverages Supabase for backend services, including authentication and real-time database updates.

## Key Components

1. **Frontend**
   - Next.js: React framework for server-side rendering and static site generation
   - React: UI library for building component-based interfaces
   - Tailwind CSS: Utility-first CSS framework for styling
   - shadcn/ui: Reusable UI components built with Radix UI and Tailwind

2. **Backend**
   - Supabase: Provides authentication, database, and real-time subscription services
   - Next.js API Routes: Serverless functions for backend logic (e.g., push notifications)

3. **State Management**
   - React Hooks: For local component state
   - Supabase Realtime: For real-time updates across clients

4. **Authentication**
   - GitHub OAuth via Supabase Auth

5. **Push Notifications**
   - Web Push API
   - Service Workers

## Data Flow

1. User actions trigger React state updates and Supabase database mutations
2. Supabase real-time subscriptions notify all connected clients of changes
3. React components re-render based on updated state
4. Push notifications are sent for relevant actions to subscribed users

## Deployment

The application is designed to be deployed as a static site with serverless backend functions, making it suitable for platforms like Vercel or Netlify.