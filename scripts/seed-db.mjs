// Temporary script to seed Supabase database via REST API
const SUPABASE_URL = "https://cdtsviwasgblnqdambis.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "resolution=ignore-duplicates,return=minimal",
};

async function seed(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  const status = res.status;
  if (status >= 400) {
    const body = await res.text();
    console.error(`  FAILED ${table}: ${status} ${body}`);
  } else {
    console.log(`  OK ${table}: ${status} (${data.length} rows)`);
  }
}

const V_SPTC = "00000000-0000-0000-0000-000000000001";
const V_PP = "00000000-0000-0000-0000-000000000010";
const V_MC = "00000000-0000-0000-0000-000000000011";
const C_MAXIM = "00000000-0000-0000-0000-000000000002";
const C_ZOE = "00000000-0000-0000-0000-000000000003";
const C_GEORGE = "00000000-0000-0000-0000-000000000004";

const programs = [
  { id: "10000000-0000-0000-0000-000000000001", name: "Paringa Park Afterschool", slug: "mon-paringa-park", type: "school", level: "red", day_of_week: 1, start_time: "15:15", end_time: "16:00", duration_min: 45, venue_id: V_PP, status: "active", term: "Term 1 2026", description: "School-based afterschool program at Paringa Park Primary School" },
  { id: "10000000-0000-0000-0000-000000000002", name: "Mon Red Ball", slug: "mon-red-ball", type: "group", level: "red", day_of_week: 1, start_time: "16:15", end_time: "17:00", duration_min: 45, venue_id: V_SPTC, term_fee_cents: 16000, per_session_cents: 2000, status: "active", term: "Term 1 2026" },
  { id: "10000000-0000-0000-0000-000000000003", name: "Mon Orange Ball", slug: "mon-orange-ball", type: "group", level: "orange", day_of_week: 1, start_time: "17:00", end_time: "17:45", duration_min: 45, venue_id: V_SPTC, term_fee_cents: 16000, per_session_cents: 2000, status: "active", term: "Term 1 2026" },
  { id: "10000000-0000-0000-0000-000000000004", name: "Mon Green Ball", slug: "mon-green-ball", type: "group", level: "green", day_of_week: 1, start_time: "17:45", end_time: "18:30", duration_min: 45, venue_id: V_SPTC, term_fee_cents: 16000, per_session_cents: 2000, status: "active", term: "Term 1 2026" },
  { id: "10000000-0000-0000-0000-000000000005", name: "Mon Yellow Ball", slug: "mon-yellow-ball", type: "group", level: "yellow", day_of_week: 1, start_time: "18:30", end_time: "19:30", duration_min: 60, venue_id: V_SPTC, term_fee_cents: 20000, per_session_cents: 2500, status: "active", term: "Term 1 2026" },
  { id: "10000000-0000-0000-0000-000000000006", name: "Tue Blue Ball", slug: "tue-blue-ball", type: "group", level: "blue", day_of_week: 2, start_time: "15:45", end_time: "16:15", duration_min: 30, venue_id: V_SPTC, term_fee_cents: 12000, per_session_cents: 1500, status: "active", term: "Term 1 2026" },
  { id: "10000000-0000-0000-0000-000000000007", name: "Tue Red Ball", slug: "tue-red-ball", type: "group", level: "red", day_of_week: 2, start_time: "16:00", end_time: "16:45", duration_min: 45, venue_id: V_SPTC, term_fee_cents: 16000, per_session_cents: 2000, status: "active", term: "Term 1 2026", description: "Zoe starts at 4:00pm, Maxim takes over at 4:15pm" },
  { id: "10000000-0000-0000-0000-000000000008", name: "Tue Orange Ball", slug: "tue-orange-ball", type: "group", level: "orange", day_of_week: 2, start_time: "16:45", end_time: "17:30", duration_min: 45, venue_id: V_SPTC, term_fee_cents: 16000, per_session_cents: 2000, status: "active", term: "Term 1 2026" },
  { id: "10000000-0000-0000-0000-000000000009", name: "Tue Green Ball", slug: "tue-green-ball", type: "group", level: "green", day_of_week: 2, start_time: "17:30", end_time: "18:15", duration_min: 45, venue_id: V_SPTC, term_fee_cents: 16000, per_session_cents: 2000, status: "active", term: "Term 1 2026" },
  { id: "10000000-0000-0000-0000-000000000010", name: "McAuley Afterschool", slug: "wed-mcauley", type: "school", level: "red", day_of_week: 3, start_time: "15:15", end_time: "16:00", duration_min: 45, venue_id: V_MC, term_fee_cents: 6000, per_session_cents: 2000, status: "active", term: "Term 1 2026", description: "Afterschool program at McAuley. 3 paid weeks + 1 free trial." },
  { id: "10000000-0000-0000-0000-000000000011", name: "Wed Girls Red Ball", slug: "wed-girls-red", type: "group", level: "red", day_of_week: 3, start_time: "16:15", end_time: "17:00", duration_min: 45, venue_id: V_SPTC, term_fee_cents: 16000, per_session_cents: 2000, status: "active", term: "Term 1 2026", description: "Girls only" },
  { id: "10000000-0000-0000-0000-000000000012", name: "Wed Girls Orange/Green", slug: "wed-girls-orange-green", type: "group", level: "orange-green", day_of_week: 3, start_time: "17:00", end_time: "17:45", duration_min: 45, venue_id: V_SPTC, term_fee_cents: 16000, per_session_cents: 2000, status: "active", term: "Term 1 2026", description: "Girls only" },
  { id: "10000000-0000-0000-0000-000000000013", name: "Wed Girls Yellow", slug: "wed-girls-yellow", type: "group", level: "yellow", day_of_week: 3, start_time: "17:45", end_time: "18:45", duration_min: 60, venue_id: V_SPTC, term_fee_cents: 20000, per_session_cents: 2500, status: "active", term: "Term 1 2026", description: "Girls only" },
  { id: "10000000-0000-0000-0000-000000000014", name: "Wed Yellow Ball", slug: "wed-yellow-ball", type: "group", level: "yellow", day_of_week: 3, start_time: "18:45", end_time: "19:45", duration_min: 60, venue_id: V_SPTC, term_fee_cents: 20000, per_session_cents: 2500, status: "active", term: "Term 1 2026" },
  { id: "10000000-0000-0000-0000-000000000015", name: "Thu Red Squad", slug: "thu-red-squad", type: "squad", level: "red", day_of_week: 4, start_time: "16:00", end_time: "16:45", duration_min: 45, venue_id: V_SPTC, term_fee_cents: 16000, per_session_cents: 2000, status: "active", term: "Term 1 2026", description: "Invitation/selection based performance squad" },
  { id: "10000000-0000-0000-0000-000000000016", name: "Thu Orange Squad", slug: "thu-orange-squad", type: "squad", level: "orange", day_of_week: 4, start_time: "16:45", end_time: "17:30", duration_min: 45, venue_id: V_SPTC, term_fee_cents: 16000, per_session_cents: 2000, status: "active", term: "Term 1 2026", description: "Invitation/selection based performance squad" },
  { id: "10000000-0000-0000-0000-000000000017", name: "Thu Green Squad", slug: "thu-green-squad", type: "squad", level: "green", day_of_week: 4, start_time: "17:30", end_time: "18:15", duration_min: 45, venue_id: V_SPTC, term_fee_cents: 16000, per_session_cents: 2000, status: "active", term: "Term 1 2026", description: "Invitation/selection based performance squad" },
  { id: "10000000-0000-0000-0000-000000000018", name: "Thu Yellow Squad", slug: "thu-yellow-squad", type: "squad", level: "yellow", day_of_week: 4, start_time: "18:15", end_time: "19:15", duration_min: 60, venue_id: V_SPTC, term_fee_cents: 20000, per_session_cents: 2500, status: "active", term: "Term 1 2026", description: "Invitation/selection based performance squad" },
  { id: "10000000-0000-0000-0000-000000000019", name: "Thu Elite Squad", slug: "thu-elite-squad", type: "squad", level: "elite", day_of_week: 4, start_time: "19:15", end_time: "20:30", duration_min: 75, venue_id: V_SPTC, status: "active", term: "Term 1 2026", description: "High-performance squad. George and Sota (8+ UTR)." },
  { id: "10000000-0000-0000-0000-000000000020", name: "Fri Red/Orange Match Play", slug: "fri-match-play", type: "competition", level: "red-orange", day_of_week: 5, start_time: "16:15", end_time: "17:15", duration_min: 60, venue_id: V_SPTC, term_fee_cents: 20000, per_session_cents: 2500, status: "active", term: "Term 1 2026", description: "Supervised match play run by Zoe" },
  { id: "10000000-0000-0000-0000-000000000021", name: "Sat Red Comp", slug: "sat-red-comp", type: "competition", level: "red", day_of_week: 6, start_time: "11:00", end_time: "12:00", duration_min: 60, venue_id: V_SPTC, term_fee_cents: 20000, per_session_cents: 2500, status: "active", term: "Term 1 2026", description: "Saturday competition run by Zoe" },
  { id: "10000000-0000-0000-0000-000000000022", name: "Sat Orange/Green Comp", slug: "sat-orange-green-comp", type: "competition", level: "orange-green", day_of_week: 6, start_time: "11:00", end_time: "12:15", duration_min: 75, venue_id: V_SPTC, status: "active", term: "Term 1 2026", description: "Saturday competition" },
];

const programCoaches = [
  // Monday - all Maxim
  { program_id: "10000000-0000-0000-0000-000000000001", coach_id: C_MAXIM, role: "primary" },
  { program_id: "10000000-0000-0000-0000-000000000002", coach_id: C_MAXIM, role: "primary" },
  { program_id: "10000000-0000-0000-0000-000000000003", coach_id: C_MAXIM, role: "primary" },
  { program_id: "10000000-0000-0000-0000-000000000004", coach_id: C_MAXIM, role: "primary" },
  { program_id: "10000000-0000-0000-0000-000000000005", coach_id: C_MAXIM, role: "primary" },
  // Tuesday
  { program_id: "10000000-0000-0000-0000-000000000006", coach_id: C_MAXIM, role: "primary" },
  { program_id: "10000000-0000-0000-0000-000000000007", coach_id: C_MAXIM, role: "primary", availability: "Takes over at 4:15pm" },
  { program_id: "10000000-0000-0000-0000-000000000007", coach_id: C_ZOE, role: "assistant", availability: "Starts at 4:00pm, hands over at 4:15pm" },
  { program_id: "10000000-0000-0000-0000-000000000008", coach_id: C_MAXIM, role: "primary" },
  { program_id: "10000000-0000-0000-0000-000000000009", coach_id: C_MAXIM, role: "primary" },
  // Wednesday - all Maxim
  { program_id: "10000000-0000-0000-0000-000000000010", coach_id: C_MAXIM, role: "primary" },
  { program_id: "10000000-0000-0000-0000-000000000011", coach_id: C_MAXIM, role: "primary" },
  { program_id: "10000000-0000-0000-0000-000000000012", coach_id: C_MAXIM, role: "primary" },
  { program_id: "10000000-0000-0000-0000-000000000013", coach_id: C_MAXIM, role: "primary" },
  { program_id: "10000000-0000-0000-0000-000000000014", coach_id: C_MAXIM, role: "primary" },
  // Thursday - Maxim + George assistant
  { program_id: "10000000-0000-0000-0000-000000000015", coach_id: C_MAXIM, role: "primary" },
  { program_id: "10000000-0000-0000-0000-000000000015", coach_id: C_GEORGE, role: "assistant" },
  { program_id: "10000000-0000-0000-0000-000000000016", coach_id: C_MAXIM, role: "primary" },
  { program_id: "10000000-0000-0000-0000-000000000016", coach_id: C_GEORGE, role: "assistant" },
  { program_id: "10000000-0000-0000-0000-000000000017", coach_id: C_MAXIM, role: "primary" },
  { program_id: "10000000-0000-0000-0000-000000000017", coach_id: C_GEORGE, role: "assistant" },
  { program_id: "10000000-0000-0000-0000-000000000018", coach_id: C_MAXIM, role: "primary" },
  { program_id: "10000000-0000-0000-0000-000000000018", coach_id: C_GEORGE, role: "assistant" },
  { program_id: "10000000-0000-0000-0000-000000000019", coach_id: C_MAXIM, role: "primary" },
  // Friday - Zoe
  { program_id: "10000000-0000-0000-0000-000000000020", coach_id: C_ZOE, role: "primary" },
  // Saturday
  { program_id: "10000000-0000-0000-0000-000000000021", coach_id: C_ZOE, role: "primary" },
  { program_id: "10000000-0000-0000-0000-000000000022", coach_id: C_MAXIM, role: "primary" },
];

function normalize(arr) {
  const allKeys = new Set();
  arr.forEach((obj) => Object.keys(obj).forEach((k) => allKeys.add(k)));
  return arr.map((obj) => {
    const out = {};
    for (const k of allKeys) out[k] = obj[k] ?? null;
    return out;
  });
}

async function run() {
  console.log("Seeding Supabase database...");
  await seed("programs", normalize(programs));
  await seed("program_coaches", normalize(programCoaches));
  console.log("Done!");
}

run().catch(console.error);
