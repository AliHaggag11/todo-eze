'use client'

import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Session } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import Auth from './components/Auth'
import TodoList from './components/TodoList'
import { Button } from '@/app/components/ui/button'

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
    await supabase.auth.signOut()
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <QueryClientProvider client={queryClient}>
      {!session ? (
        <Auth />
      ) : (
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center my-8">
            <h1 className="text-3xl font-bold">Collaborative Todo List</h1>
            <Button onClick={handleLogout} variant="outline">Logout</Button>
          </div>
          <TodoList />
        </div>
      )}
    </QueryClientProvider>
  )
}
