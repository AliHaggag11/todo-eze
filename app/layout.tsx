'use client'

import { useState, useEffect } from 'react'
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/app/components/ui/toaster"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import DotPattern from '@/app/components/magicui/dot-pattern'

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  return (
    <html lang="en">
      <body className={`${inter.className} relative`}>
        {isLoggedIn && (
          <DotPattern
            width={16}
            height={16}
            cx={0.5}
            cy={0.5}
            cr={0.5}
            className="absolute inset-0 h-full w-full text-gray-200 dark:text-gray-800 opacity-50 -z-10"
          />
        )}
        <div className="relative z-10">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  )
}
