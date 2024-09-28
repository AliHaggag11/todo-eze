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

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)
  const [greeting, setGreeting] = useState(getGreeting())
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        setUserName(session.user.user_metadata.full_name || session.user.email)
      }
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        setUserName(session.user.user_metadata.full_name || session.user.email)
      }
      setIsLoading(false)
    })

    // Update greeting every minute
    const intervalId = setInterval(() => {
      setGreeting(getGreeting())
    }, 60000)

    return () => {
      subscription.unsubscribe()
      clearInterval(intervalId)
    }
  }, [supabase.auth])

  const handleLogout = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      {!session ? (
        <Auth />
      ) : (
        <div className="container mx-auto px-4">
          <header className="flex flex-col items-start my-8">
            <div className="flex justify-between items-center w-full">
              <h1 className="text-3xl font-bold text-black dark:text-white">Collaborative Todo List</h1>
              <Button 
                onClick={handleLogout} 
                variant="outline"
                disabled={isLoading}
                className="ml-4"
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
            </div>
            {userName && (
              <p className="text-lg text-blue-400 dark:text-blue-300 mt-3 font-medium">
                {greeting}, {userName}
              </p>
            )}
          </header>
          <TodoList />
        </div>
      )}
    </QueryClientProvider>
  )
}
