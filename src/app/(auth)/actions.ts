'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateFormData, loginFormSchema, signupFormSchema, magicLinkFormSchema } from '@/lib/utils/validation'
import { checkRateLimit } from '@/lib/utils/rate-limit'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const parsed = validateFormData(formData, loginFormSchema)
  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent(parsed.error)}`)
  }

  // Rate limit: 5 login attempts per minute per email
  if (!checkRateLimit(`login:${parsed.data.email}`, 5, 60_000)) {
    redirect('/login?error=' + encodeURIComponent('Too many login attempts. Please wait a minute.'))
  }

  const { email, password } = parsed.data
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function loginWithMagicLink(formData: FormData) {
  const supabase = await createClient()

  const parsed = validateFormData(formData, magicLinkFormSchema)
  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent(parsed.error)}`)
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/verify?type=magic-link')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const parsed = validateFormData(formData, signupFormSchema)
  if (!parsed.success) {
    redirect(`/signup?error=${encodeURIComponent(parsed.error)}`)
  }

  const { email, password, full_name: fullName, invite_token: inviteToken } = parsed.data

  // Rate limit: 3 signup attempts per minute per email
  if (!checkRateLimit(`signup:${email}`, 3, 60_000)) {
    redirect('/signup?error=' + encodeURIComponent('Too many signup attempts. Please wait a minute.'))
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        ...(inviteToken ? { invite_token: inviteToken } : {}),
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    const inviteParam = inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : ''
    redirect(`/signup?error=${encodeURIComponent(error.message)}${inviteParam}`)
  }

  redirect('/verify?type=signup')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
