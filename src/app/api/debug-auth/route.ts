import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing env vars' })
  }

  // List all cookies
  const allCookies = request.cookies.getAll().map(c => ({
    name: c.name,
    valueLength: c.value.length,
    isSupabase: c.name.includes('supabase') || c.name.includes('sb-'),
  }))

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll() {},
    },
  })

  const { data: { user }, error } = await supabase.auth.getUser()

  return NextResponse.json({
    hasUser: !!user,
    userEmail: user?.email || null,
    error: error?.message || null,
    cookieCount: allCookies.length,
    supabaseCookies: allCookies.filter(c => c.isSupabase),
    allCookieNames: allCookies.map(c => c.name),
  })
}
