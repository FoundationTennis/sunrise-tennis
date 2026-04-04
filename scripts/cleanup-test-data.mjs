/**
 * Clean up all test data from Sunrise Tennis database
 *
 * Removes all families with display_id LIKE 'T%', coaches with @sunrise.test
 * email, and their associated auth users, in FK-safe order.
 *
 * Usage:
 *   cd /c/Users/maxim/Projects/sunrise-tennis
 *   export $(grep SUPABASE_SERVICE_ROLE_KEY .env.local | xargs)
 *   node scripts/cleanup-test-data.mjs
 */

const SUPABASE_URL = "https://cdtsviwasgblnqdambis.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function restSelect(table, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  return res.json();
}

async function restDelete(table, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers,
  });
  if (res.status >= 400) {
    const body = await res.text();
    console.error(`  FAILED delete ${table}: ${res.status} ${body}`);
    return 0;
  }
  const data = await res.json();
  const count = Array.isArray(data) ? data.length : 0;
  console.log(`  ${table}: ${count} row(s) deleted`);
  return count;
}

async function deleteAuthUser(userId) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  if (res.status >= 400) {
    const body = await res.text();
    console.error(`  FAILED delete auth user ${userId}: ${res.status} ${body}`);
    return false;
  }
  return true;
}

async function run() {
  console.log("\n=== Cleaning Up Test Data ===\n");

  // 1. Find test families
  const families = await restSelect("families", "display_id=like.T*&select=id,display_id");
  const familyIds = families.map((f) => f.id);
  console.log(`Found ${familyIds.length} test families: ${families.map((f) => f.display_id).join(", ")}`);

  if (familyIds.length === 0) {
    console.log("No test families found. Nothing to clean up.\n");
  }

  // 2. Find test coaches
  const coaches = await restSelect("coaches", "email=like.*@sunrise.test&select=id,name,user_id");
  const coachIds = coaches.map((c) => c.id);
  const coachUserIds = coaches.filter((c) => c.user_id).map((c) => c.user_id);
  console.log(`Found ${coachIds.length} test coaches: ${coaches.map((c) => c.name).join(", ")}`);

  // 3. Find test players
  let playerIds = [];
  if (familyIds.length > 0) {
    const players = await restSelect(
      "players",
      `family_id=in.(${familyIds.join(",")})&select=id`
    );
    playerIds = players.map((p) => p.id);
    console.log(`Found ${playerIds.length} test players`);
  }

  // 4. Find parent auth user IDs from user_roles
  let parentUserIds = [];
  if (familyIds.length > 0) {
    const parentRoles = await restSelect(
      "user_roles",
      `family_id=in.(${familyIds.join(",")})&role=eq.parent&select=user_id`
    );
    parentUserIds = parentRoles.map((r) => r.user_id).filter(Boolean);
    console.log(`Found ${parentUserIds.length} parent auth users`);
  }

  // 5. Find payments for test families (needed for payment_allocations)
  let paymentIds = [];
  if (familyIds.length > 0) {
    const payments = await restSelect(
      "payments",
      `family_id=in.(${familyIds.join(",")})&select=id`
    );
    paymentIds = payments.map((p) => p.id);
  }

  console.log("\nDeleting in FK-safe order...");

  // Delete in dependency order
  if (paymentIds.length > 0) {
    await restDelete("payment_allocations", `payment_id=in.(${paymentIds.join(",")})`);
  }
  if (familyIds.length > 0) {
    await restDelete("charges", `family_id=in.(${familyIds.join(",")})`);
    await restDelete("payments", `family_id=in.(${familyIds.join(",")})`);
    await restDelete("bookings", `family_id=in.(${familyIds.join(",")})`);
  }
  if (playerIds.length > 0) {
    await restDelete("attendances", `player_id=in.(${playerIds.join(",")})`);
    await restDelete("lesson_notes", `player_id=in.(${playerIds.join(",")})`);
    await restDelete("program_roster", `player_id=in.(${playerIds.join(",")})`);
  }
  if (familyIds.length > 0) {
    await restDelete("family_balance", `family_id=in.(${familyIds.join(",")})`);
    await restDelete("players", `family_id=in.(${familyIds.join(",")})`);
  }
  if (coachIds.length > 0) {
    await restDelete("program_coaches", `coach_id=in.(${coachIds.join(",")})`);
    await restDelete("coach_earnings", `coach_id=in.(${coachIds.join(",")})`);
  }

  // Delete user_roles for all test users
  const allTestUserIds = [...parentUserIds, ...coachUserIds].filter(Boolean);
  if (allTestUserIds.length > 0) {
    await restDelete("user_roles", `user_id=in.(${allTestUserIds.join(",")})`);
  }

  // Delete families and coaches
  if (familyIds.length > 0) {
    await restDelete("families", "display_id=like.T*");
  }
  if (coachIds.length > 0) {
    await restDelete("coaches", "email=like.*@sunrise.test");
  }

  // Delete auth users
  console.log("\nDeleting auth users...");
  let authDeleted = 0;
  for (const uid of allTestUserIds) {
    const ok = await deleteAuthUser(uid);
    if (ok) authDeleted++;
  }
  console.log(`  ${authDeleted} auth user(s) deleted`);

  console.log("\n=== Cleanup Complete ===\n");
}

run().catch(console.error);
