import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUser } from '@supabase/auth-helpers-react'
import { Button } from '@/app/components/ui/button'
import { Database } from '@/lib/database.types'
import { useToast } from "@/hooks/use-toast"

export default function PushNotificationSubscriber() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const supabase = createClientComponentClient<Database>()
  const user = useUser()
  const { toast } = useToast()

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(function(registration) {
        registration.pushManager.getSubscription().then(function(subscription) {
          setIsSubscribed(!!subscription)
        })
      })
    }
  }, [])

  const subscribeUser = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        })

        if (user?.id) {
          const { error } = await supabase.from('push_subscriptions').insert({
            user_id: user.id,
            subscription: JSON.stringify(subscription)
          })

          if (error) throw error

          setIsSubscribed(true)
          toast({
            title: "Notifications enabled",
            description: "You will now receive push notifications.",
          })
        } else {
          throw new Error('User not found')
        }
      } catch (error) {
        console.error('Failed to subscribe the user: ', error)
        toast({
          title: "Error",
          description: "Failed to enable notifications. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <Button onClick={subscribeUser} disabled={isSubscribed}>
      {isSubscribed ? 'Notifications Enabled' : 'Enable Notifications'}
    </Button>
  )
}