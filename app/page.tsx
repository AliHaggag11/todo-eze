'use client'

import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Session, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import Auth from './components/Auth'
import TodoList from './components/TodoList'

const queryClient = new QueryClient()

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null)

  useEffect(() => {
    const initSupabase = async () => {
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
      const supabaseInstance = createClientComponentClient<Database>()
      setSupabase(supabaseInstance)

      const { data: { session } } = await supabaseInstance.auth.getSession()
      setSession(session)

      const { data: { subscription } } = supabaseInstance.auth.onAuthStateChange((_event, session) => {
        setSession(session)
      })

      return () => subscription.unsubscribe()
    }

    initSupabase()
  }, [])

  if (!supabase) return null

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
