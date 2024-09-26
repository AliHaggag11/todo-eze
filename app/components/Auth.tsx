import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/app/components/ui/button'
import { Database } from '@/lib/database.types'
import RetroGrid from '@/app/components/magicui/retro-grid'

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
    <div className="relative h-screen w-full flex flex-col justify-center items-center">
      <RetroGrid className="absolute inset-0 z-0" />
      <div className="z-10 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Welcome to Collaborative Todo List</h1>
        <Button onClick={handleLogin} disabled={loading} className="w-full">
          {loading ? 'Loading...' : 'Sign in with GitHub'}
        </Button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  )
}