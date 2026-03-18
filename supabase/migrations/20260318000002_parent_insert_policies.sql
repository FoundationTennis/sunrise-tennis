-- Missing parent INSERT policies for enrollment and payment flows

-- Parents can enroll their own children in programs
CREATE POLICY "parent_program_roster_insert" ON program_roster
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) = 'parent'
    AND player_id IN (
      SELECT id FROM players WHERE family_id = get_user_family_id(auth.uid())
    )
  );

-- Parents can create payment records for their own family (Square card payments)
CREATE POLICY "parent_payments_insert" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) = 'parent'
    AND family_id = get_user_family_id(auth.uid())
  );

-- Parents can update their family's balance (for payment processing)
CREATE POLICY "parent_family_balance_update" ON family_balance
  FOR UPDATE TO authenticated
  USING (
    get_user_role(auth.uid()) = 'parent'
    AND family_id = get_user_family_id(auth.uid())
  );

-- Parents can insert family balance if it doesn't exist yet
CREATE POLICY "parent_family_balance_insert" ON family_balance
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) = 'parent'
    AND family_id = get_user_family_id(auth.uid())
  );
