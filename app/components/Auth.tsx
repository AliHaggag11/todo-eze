import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/app/components/ui/button'  // Add this import
import { Database } from '@/lib/database.types'
import { GithubIcon } from 'lucide-react'
import Ripple from '@/app/components/magicui/ripple'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient<Database>()

  const handleLogin = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Error logging in:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-900 text-white overflow-hidden">
      <Ripple className="absolute inset-0 z-0" />
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg z-10">
        <h1 className="text-3xl font-bold mb-6 text-center">Welcome to Todo List</h1>
        <p className="text-gray-400 mb-8 text-center">Sign in to manage your tasks</p>
        <Button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded flex items-center justify-center"
        >
          {loading ? (
            'Loading...'
          ) : (
            <>
              <GithubIcon className="w-5 h-5 mr-2" />
              Sign in with GitHub
            </>
          )}
        </Button>
      </div>
    </div>
  )
}