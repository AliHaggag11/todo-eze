import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUser } from '@supabase/auth-helpers-react'
import { Button } from '@/app/components/ui/button'
import { Database } from '@/lib/database.types'

export default function PushNotificationSubscriber() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const supabase = createClientComponentClient<Database>()
  const user = useUser()

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
          await supabase.from('push_subscriptions').insert({
            user_id: user.id,
            subscription: JSON.stringify(subscription)
          })
        }

        setIsSubscribed(true)
      } catch (error) {
        console.error('Failed to subscribe the user: ', error)
      }
    }
  }

  return (
    <Button onClick={subscribeUser} disabled={isSubscribed}>
      {isSubscribed ? 'Notifications Enabled' : 'Enable Notifications'}
    </Button>
  )
}