import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/app/components/ui/button'

export default function Auth() {
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error logging in:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <Button onClick={handleLogin} disabled={loading}>
        {loading ? 'Loading...' : 'Sign in with GitHub'}
      </Button>
    </div>
  )
}