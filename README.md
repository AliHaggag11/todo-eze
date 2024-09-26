# Collaborative Todo List

## Project Overview

This project is a real-time collaborative todo list application built with Next.js, React, and Supabase. It allows users to create, manage, and share tasks in real-time, making it ideal for team collaboration or personal task management. The application is also a Progressive Web App (PWA), providing an app-like experience on supported devices.

## Features

- User authentication with GitHub
- Real-time task updates
- Create, read, update, and delete (CRUD) operations for tasks
- Responsive design for mobile and desktop
- Dark mode support
- Progressive Web App (PWA) functionality

## Tech Stack

### Frontend
- **Next.js**: A React framework for building server-side rendered and statically generated web applications.
- **React**: A JavaScript library for building user interfaces.
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
- **Tailwind CSS**: A utility-first CSS framework for rapidly building custom user interfaces.
- **shadcn/ui**: A collection of re-usable components built with Radix UI and Tailwind CSS.

### Backend
- **Supabase**: An open-source Firebase alternative providing a PostgreSQL database, authentication, instant APIs, and real-time subscriptions.

### State Management
- **React Query**: A library for managing, caching, and syncing asynchronous and remote data in React.
- **Zustand**: A small, fast, and scalable state management solution for React.

### PWA
- **Service Worker**: For offline functionality and caching.
- **Web Manifest**: For installable PWA experience.

### Development Tools
- **ESLint**: A static code analysis tool for identifying problematic patterns in JavaScript code.
- **Prettier**: An opinionated code formatter to ensure consistent code style.

## Why This Stack?

1. **Next.js**: Chosen for its server-side rendering capabilities, optimized performance, and excellent developer experience. It provides a solid foundation for building scalable React applications.

2. **React**: The most popular JavaScript library for building user interfaces, offering a component-based architecture and a vast ecosystem of tools and libraries.

3. **TypeScript**: Adds static typing to JavaScript, improving code quality, catching errors early, and enhancing developer productivity through better tooling support.

4. **Tailwind CSS**: Enables rapid UI development with its utility-first approach, resulting in faster development cycles and easier maintenance of styles.

5. **shadcn/ui**: Provides a set of accessible and customizable UI components, speeding up development and ensuring a consistent look and feel across the application.

6. **Supabase**: Offers a powerful backend-as-a-service solution with real-time capabilities, simplifying database management, authentication, and API development.

7. **React Query**: Simplifies data fetching, caching, and state management for remote data, improving application performance and user experience.

8. **Zustand**: A lightweight state management solution that's easy to use and integrate, perfect for managing local UI state.

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/collaborative-todo-list.git
   ```

2. Install dependencies:
   ```bash
   cd collaborative-todo-list
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## PWA Features

- **Installable**: Users can install the app on their devices for quick access.
- **App-like Experience**: The PWA provides a native app-like experience on supported devices.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
