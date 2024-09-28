# Collaborative Todo List

## Project Overview

This project is a real-time collaborative todo list application built with Next.js, React, and Supabase. It allows users to create, manage, and share tasks in real-time, making it ideal for team collaboration or personal task management. The application is also a Progressive Web App (PWA), providing an app-like experience on supported devices.

## Features

- User authentication with GitHub
- Real-time task updates
- Create, read, update, and delete (CRUD) operations for tasks
- Push notifications for task changes (add, edit, delete)
- Responsive design for mobile and desktop
- Dark mode support
- Progressive Web App (PWA) functionality
- Loading indicators for better user experience

## Tech Stack

### Frontend
- **Next.js**: A React framework for building server-side rendered and statically generated web applications.
- **React**: A JavaScript library for building user interfaces.
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
- **Tailwind CSS**: A utility-first CSS framework for rapidly building custom user interfaces.
- **shadcn/ui**: A collection of re-usable components built with Radix UI and Tailwind CSS.
- **Lucide React**: A library of beautifully crafted open-source icons.

### Backend
- **Supabase**: An open-source Firebase alternative providing a PostgreSQL database, authentication, instant APIs, and real-time subscriptions.

### State Management
- **React Query**: A library for managing, caching, and syncing asynchronous and remote data in React.

### Push Notifications
- **web-push**: A library for implementing Web Push protocol.

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
   VAPID_PRIVATE_KEY=your_vapid_private_key
   ```
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

The app is ready to be deployed to platforms like Vercel or Netlify. Make sure to set up the environment variables in your deployment platform.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
