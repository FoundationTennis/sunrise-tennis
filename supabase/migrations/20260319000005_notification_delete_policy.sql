-- Allow users to delete their own notification recipients
CREATE POLICY "own_notification_recipients_delete" ON notification_recipients
  FOR DELETE USING (user_id = auth.uid());
