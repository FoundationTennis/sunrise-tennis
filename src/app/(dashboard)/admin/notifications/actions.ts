'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, getSessionUser, requireAdmin } from '@/lib/supabase/server'
import { sendNotificationToTarget } from '@/lib/push/send'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { validateFormData, sendNotificationFormSchema } from '@/lib/utils/validation'

export async function sendNotification(formData: FormData) {
  const user = await requireAdmin()
  const supabase = await createClient()

  // Rate limit: 10 notifications per minute per admin
  const { checkRateLimitAsync } = await import('@/lib/utils/rate-limit')
  if (!await checkRateLimitAsync(`notify:${user.id}`, 10, 60_000)) {
    redirect('/admin/notifications/compose?error=' + encodeURIComponent('Too many notifications. Please wait a moment.'))
  }

  const parsed = validateFormData(formData, sendNotificationFormSchema)
  if (!parsed.success) {
    redirect('/admin/notifications/compose?error=' + encodeURIComponent(parsed.error))
  }

  const { type, title, body, url, target_type: targetType, target_id: targetId, target_level: targetLevel } = parsed.data

  // Insert notification record
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      type,
      title,
      body: body || null,
      url: url || null,
      target_type: targetType,
      target_id: targetId || null,
      target_level: targetLevel || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) {
    redirect(`/admin/notifications/compose?error=${encodeURIComponent(error.message)}`)
  }

  // Resolve targets and send push
  const userIds = await sendNotificationToTarget({
    title,
    body: body || '',
    url: url || undefined,
    targetType,
    targetId: targetId || undefined,
    targetLevel: targetLevel || undefined,
  })

  // Create recipient records using service role (since admin can't insert to other users' rows)
  if (userIds.length > 0 && notification) {
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    await serviceClient
      .from('notification_recipients')
      .insert(
        userIds.map((uid) => ({
          notification_id: notification.id,
          user_id: uid,
        })),
      )
  }

  revalidatePath('/admin/notifications')
  redirect(`/admin/notifications?success=Notification sent to ${userIds.length} users`)
}
