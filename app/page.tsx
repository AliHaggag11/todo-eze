'use client'

import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Session } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import Auth from './components/Auth'
import TodoList from './components/TodoList'
import { Button } from '@/app/components/ui/button'
import { Loader2 } from 'lucide-react'

const queryClient = new QueryClient()

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleLogout = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      {!session ? (
        <Auth />
      ) : (
        <div className="container mx-auto px-4">
          <header className="flex flex-col sm:flex-row justify-between items-center my-8 space-y-4 sm:space-y-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Collaborative Todo List</h1>
            <Button 
              onClick={handleLogout} 
              variant="outline"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                'Logout'
              )}
            </Button>
          </header>
          <TodoList />
        </div>
      )}
    </QueryClientProvider>
  )
}
