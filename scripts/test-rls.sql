CREATE OR REPLACE FUNCTION test_parent_upsert()
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  tp5_uid uuid;
  test_session uuid;
  test_player uuid := 'bbbb0000-0000-4000-a000-000000000008';
  result text;
BEGIN
  SELECT id INTO tp5_uid FROM auth.users WHERE email = 'tp5@sunrise.test';
  SELECT s.id INTO test_session FROM sessions s
    JOIN program_roster pr ON pr.player_id = test_player
    JOIN programs p ON p.id = pr.program_id AND p.id = s.program_id
    WHERE s.status = 'scheduled' AND s.date >= CURRENT_DATE
    LIMIT 1;

  IF test_session IS NULL THEN
    RETURN 'No session found for player';
  END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', tp5_uid, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  BEGIN
    INSERT INTO attendances (session_id, player_id, status)
    VALUES (test_session, test_player, 'absent')
    ON CONFLICT (session_id, player_id)
    DO UPDATE SET status = 'absent';
    result := 'SUCCESS';
  EXCEPTION WHEN OTHERS THEN
    result := 'ERROR: ' || SQLERRM;
  END;

  PERFORM set_config('role', 'postgres', true);

  -- Clean up the test attendance
  DELETE FROM attendances WHERE session_id = test_session AND player_id = test_player AND status = 'absent';

  RETURN result || ' session=' || test_session || ' player=' || test_player;
END;
$$;
SELECT test_parent_upsert();
DROP FUNCTION test_parent_upsert();
