'use client'

import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Session } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import Auth from './components/Auth'
import TodoList from './components/TodoList'
import { Button } from '@/app/components/ui/button'
import { Loader2, Bell, BellOff } from 'lucide-react'

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
  const [pushNotificationSupported, setPushNotificationSupported] = useState(false)
  const [pushNotificationEnabled, setPushNotificationEnabled] = useState(false)
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null)
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

    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushNotificationSupported(true)
      checkPushNotificationStatus()
    }

    return () => {
      subscription.unsubscribe()
      clearInterval(intervalId)
    }
  }, [supabase.auth])

  const checkPushNotificationStatus = async () => {
    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      const storedSubscription = localStorage.getItem('pushSubscription')
      if (storedSubscription) {
        subscription = JSON.parse(storedSubscription)
      }
    }
    setPushNotificationEnabled(!!subscription)
    setPushSubscription(subscription)
  }

  const handlePushNotificationToggle = async () => {
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return
    }

    const registration = await navigator.serviceWorker.ready
    if (pushNotificationEnabled) {
      await pushSubscription?.unsubscribe()
      setPushNotificationEnabled(false)
      setPushSubscription(null)
      localStorage.removeItem('pushSubscription')
      console.log('Push notification disabled')
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', session?.user.id);
    } else {
      try {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        })
        setPushNotificationEnabled(true)
        setPushSubscription(subscription)
        localStorage.setItem('pushSubscription', JSON.stringify(subscription))
        console.log('Push notification enabled', subscription)

        // Save the subscription to the database
        await supabase
          .from('push_subscriptions')
          .upsert({ user_id: session?.user.id, subscription }, { onConflict: 'user_id' });
      } catch (error) {
        console.error('Failed to subscribe to push notifications', error)
      }
    }
  }

  const handleLogout = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500 dark:text-gray-400" />
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      {!session ? (
        <Auth />
      ) : (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
          <div className="container mx-auto px-4 py-8">
            <header className="flex flex-col items-start mb-8">
              <div className="flex justify-between items-center w-full">
                <h1 className="text-3xl font-bold">Collaborative Todo List</h1>
                <div className="flex items-center space-x-2">
                  {pushNotificationSupported && (
                    <Button
                      onClick={handlePushNotificationToggle}
                      variant="outline"
                      size="icon"
                    >
                      {pushNotificationEnabled ? (
                        <Bell className="h-[1.2rem] w-[1.2rem]" />
                      ) : (
                        <BellOff className="h-[1.2rem] w-[1.2rem]" />
                      )}
                      <span className="sr-only">
                        {pushNotificationEnabled ? 'Disable' : 'Enable'} notifications
                      </span>
                    </Button>
                  )}
                  <Button 
                    onClick={handleLogout} 
                    variant="outline"
                    disabled={isLoading}
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
              </div>
              {userName && (
                <p className="text-lg text-blue-600 dark:text-blue-400 mt-3 font-medium">
                  {greeting}, {userName}
                </p>
              )}
            </header>
            <TodoList pushSubscription={pushSubscription} />
          </div>
        </div>
      )}
    </QueryClientProvider>
  )
}
