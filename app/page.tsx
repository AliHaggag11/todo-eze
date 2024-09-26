'use client'

import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Session } from '@supabase/supabase-js'
import Auth from './components/Auth'
import TodoList from './components/TodoList'

const queryClient = new QueryClient()

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center my-8">
          Collaborative Todo List
        </h1>
        {!session ? <Auth /> : <TodoList />}
      </div>
    </QueryClientProvider>
  )
}
