-- Competition player updates: add players, fix names, link to family records
-- G&WD competition: a1000000-0000-0000-0000-000000000003

BEGIN;

-- 1. Fix Tomas Perez van den Berg → Tomas Perez, link to family player
UPDATE competition_players
SET first_name = 'Tomas',
    last_name = 'Perez',
    player_id = 'c377376d-159f-4aaa-91cd-dc306d099b85',
    updated_at = now()
WHERE id = 'd1c1aa5b-63ba-47c3-835f-c4090aff55a5';

-- 2. Fix Olivia Treyhorn → Trayhorn spelling, link to family player
UPDATE competition_players
SET last_name = 'Trayhorn',
    player_id = '396f66e1-4cb9-48b2-abc8-607f2baa1c7d',
    updated_at = now()
WHERE id = 'd8553532-01a5-4426-afba-74db21ee1dab';

-- 3. Link Theo Ballestrin → Theodore Ballestrin family player
UPDATE competition_players
SET first_name = 'Theodore',
    player_id = '24071d77-f88c-421e-8822-e3e7bff9dd60',
    updated_at = now()
WHERE id = 'dbafcf85-14f5-47b0-bbcc-e0ab8d1db233';

-- 4. Create Div 1 Boys team for Tennyson Towns
INSERT INTO teams (id, name, competition_id, division, gender, age_group, team_size_required, nomination_status, status)
VALUES (
  gen_random_uuid(),
  'Div 1 Boys',
  'a1000000-0000-0000-0000-000000000003',
  'Division 1',
  'male',
  'junior',
  4,
  'draft',
  'active'
);

-- 5. Add Vicktorya Delavault → Div 1 Girls
INSERT INTO competition_players (team_id, first_name, last_name, gender, role, registration_status, player_id)
VALUES ('b1000000-0000-0000-0000-000000000012', 'Vicktorya', 'Delavault', 'female', 'mainstay', 'unregistered', '25678374-19bb-465b-9e11-9fcf42ef3f06');

-- 6. Add Lucille Towns → Div 1 Girls
INSERT INTO competition_players (team_id, first_name, last_name, gender, role, registration_status, player_id)
VALUES ('b1000000-0000-0000-0000-000000000012', 'Lucille', 'Towns', 'female', 'mainstay', 'unregistered', 'f915b103-8fe1-4804-b392-12283b63fe4d');

-- 7. Add Tennyson Towns → Div 1 Boys (just created above, use subquery)
INSERT INTO competition_players (team_id, first_name, last_name, gender, role, registration_status, player_id)
VALUES (
  (SELECT id FROM teams WHERE name = 'Div 1 Boys' AND competition_id = 'a1000000-0000-0000-0000-000000000003'),
  'Tennyson', 'Towns', 'male', 'mainstay', 'unregistered', '230be859-afa1-43c0-a811-924db191b203'
);

-- 8. Add Patrick Hoare → Div 3 Boys
INSERT INTO competition_players (team_id, first_name, last_name, gender, role, registration_status, player_id)
VALUES ('b1000000-0000-0000-0000-000000000011', 'Patrick', 'Hoare', 'male', 'mainstay', 'unregistered', '7e2f5a92-4fbf-49d3-97ae-cd0cbc4c114e');

-- 9. Add Beau O'Reilly → Div 3 Boys
INSERT INTO competition_players (team_id, first_name, last_name, gender, role, registration_status, player_id)
VALUES ('b1000000-0000-0000-0000-000000000011', 'Beau', 'O''Reilly', 'male', 'mainstay', 'unregistered', '1c20e018-40f7-4f4b-a15f-b483c2b7f0a7');

-- 10. Add Charlie Tierney → Div 3 Boys
INSERT INTO competition_players (team_id, first_name, last_name, gender, role, registration_status, player_id)
VALUES ('b1000000-0000-0000-0000-000000000011', 'Charlie', 'Tierney', 'male', 'mainstay', 'unregistered', 'b17e9d67-3d9d-468e-aac5-f20c8bb86156');

-- 11. Add Alexander Unsworth → Div 3 Boys
INSERT INTO competition_players (team_id, first_name, last_name, gender, role, registration_status, player_id)
VALUES ('b1000000-0000-0000-0000-000000000011', 'Alexander', 'Unsworth', 'male', 'mainstay', 'unregistered', '0036870e-0cb6-4939-a7fa-99d1c1d8be57');

-- 12. Add Anirudh Sethupathi → Div 3 Boys
INSERT INTO competition_players (team_id, first_name, last_name, gender, role, registration_status, player_id)
VALUES ('b1000000-0000-0000-0000-000000000011', 'Anirudh', 'Sethupathi', 'male', 'mainstay', 'unregistered', '91e103ed-d115-459d-9162-bac8819d1255');

COMMIT;
