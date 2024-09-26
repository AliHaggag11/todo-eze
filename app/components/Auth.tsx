import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/app/components/ui/button'
import { Database } from '@/lib/database.types'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClientComponentClient<Database>()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error: unknown) {
      console.error('Error logging in:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('An error occurred during login')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <Button onClick={handleLogin} disabled={loading}>
        {loading ? 'Loading...' : 'Sign in with GitHub'}
      </Button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  )
}