import Link from 'next/link'
import { Sun, MapPin, Phone, Clock, ChevronRight, Instagram } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@supabase/supabase-js'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const LEVEL_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  blue: { bg: 'bg-[#4A90D9]/10', border: 'border-[#4A90D9]/30', text: 'text-[#4A90D9]', dot: 'bg-[#4A90D9]' },
  red: { bg: 'bg-[#C53030]/10', border: 'border-[#C53030]/30', text: 'text-[#C53030]', dot: 'bg-[#C53030]' },
  orange: { bg: 'bg-[#E86A20]/10', border: 'border-[#E86A20]/30', text: 'text-[#E86A20]', dot: 'bg-[#E86A20]' },
  green: { bg: 'bg-[#2D8A4E]/10', border: 'border-[#2D8A4E]/30', text: 'text-[#2D8A4E]', dot: 'bg-[#2D8A4E]' },
  yellow: { bg: 'bg-[#EAB308]/10', border: 'border-[#EAB308]/30', text: 'text-[#92730A]', dot: 'bg-[#EAB308]' },
}

const LEVEL_LABELS: Record<string, string> = {
  blue: 'Blue Ball',
  red: 'Red Ball',
  orange: 'Orange Ball',
  green: 'Green Ball',
  yellow: 'Yellow Ball',
}

const LEVEL_AGES: Record<string, string> = {
  blue: 'Ages 3-5',
  red: 'Ages 5-8',
  orange: 'Ages 8-10',
  green: 'Ages 10-12',
  yellow: 'Ages 12+',
}

async function getPrograms() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data } = await supabase
    .from('programs')
    .select('id, name, type, level, day_of_week, start_time, end_time, per_session_cents')
    .eq('status', 'active')
    .in('type', ['group', 'squad'])
    .order('level')
    .order('day_of_week')

  return data ?? []
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

export default async function Home() {
  const programs = await getPrograms()

  // Group by level
  const byLevel = new Map<string, typeof programs>()
  for (const p of programs) {
    const list = byLevel.get(p.level) ?? []
    list.push(p)
    byLevel.set(p.level, list)
  }

  const levelOrder = ['blue', 'red', 'orange', 'green', 'yellow']
  const sortedLevels = [...byLevel.entries()].sort(
    (a, b) => levelOrder.indexOf(a[0]) - levelOrder.indexOf(b[0])
  )

  return (
    <div className="min-h-screen bg-[#FFFBF7]">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2B5EA7] via-[#6480A4] to-[#E87450] px-4 pb-20 pt-16 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(247,205,93,0.15),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          {/* Logo */}
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Sun className="size-8 text-[#F7CD5D]" />
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Sunrise Tennis
          </h1>
          <p className="mt-3 text-lg text-white/80 sm:text-xl">
            Junior tennis coaching for every level at Somerton Park
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full bg-white text-[#2B5EA7] hover:bg-white/90 sm:w-auto">
              <Link href="#programs">View Programs</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 sm:w-auto">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>

          {/* Venue pill */}
          <div className="mt-10 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur">
            <MapPin className="size-4" />
            Somerton Park Tennis Club, Adelaide SA
          </div>
        </div>
      </section>

      {/* ── Programs ────────────────────────────────────────────────────── */}
      <section id="programs" className="mx-auto max-w-5xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1A2332] sm:text-3xl">Programs</h2>
          <p className="mt-2 text-[#556270]">
            Group coaching programs running Term 2, 2026 at Somerton Park Tennis Club
          </p>
        </div>

        <div className="mt-10 space-y-6">
          {sortedLevels.map(([level, progs]) => {
            const colors = LEVEL_COLORS[level] ?? LEVEL_COLORS.green
            const label = LEVEL_LABELS[level] ?? level
            const ages = LEVEL_AGES[level] ?? ''

            return (
              <div key={level} className={`rounded-xl border ${colors.border} ${colors.bg} p-5`}>
                <div className="flex items-center gap-3">
                  <div className={`size-3 rounded-full ${colors.dot}`} />
                  <h3 className={`text-lg font-semibold ${colors.text}`}>{label}</h3>
                  {ages && <span className="text-xs text-[#556270]">{ages}</span>}
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {progs.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg bg-white/80 px-4 py-3 shadow-sm"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#1A2332]">
                          {DAYS[p.day_of_week ?? 0]}{' '}
                          {p.start_time && formatTime(p.start_time)}
                          {p.end_time && ` - ${formatTime(p.end_time)}`}
                        </p>
                        <p className="text-xs text-[#8899A6]">
                          {p.type === 'squad' ? 'Squad' : 'Group'}
                          {p.per_session_cents ? ` · $${(p.per_session_cents / 100).toFixed(0)}/session` : ''}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-[#8899A6]" />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {sortedLevels.length === 0 && (
            <p className="text-center text-[#8899A6]">Programs for Term 2 coming soon.</p>
          )}
        </div>

        <div className="mt-8 text-center">
          <Button asChild size="lg">
            <Link href="/signup">
              Create Account to Enrol
              <ChevronRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── About ───────────────────────────────────────────────────────── */}
      <section className="border-t border-[#E0D0BE]/50 bg-gradient-to-b from-[#FFF6ED] to-[#FFFBF7] px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-[#1A2332]">About Sunrise Tennis</h2>
          <p className="mt-4 leading-relaxed text-[#556270]">
            Sunrise Tennis provides professional tennis coaching for juniors of all ages and abilities
            at Somerton Park Tennis Club in Adelaide, South Australia. From first-time Red Ball players
            to competitive Yellow Ball squads, our programs are designed to develop skills, confidence,
            and a love of the game.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-[#E87450]/10">
                <Sun className="size-5 text-[#E87450]" />
              </div>
              <h3 className="mt-3 font-semibold text-[#1A2332]">All Levels</h3>
              <p className="mt-1 text-sm text-[#556270]">Blue Ball through to Yellow Ball competitive squads</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-[#2B5EA7]/10">
                <Clock className="size-5 text-[#2B5EA7]" />
              </div>
              <h3 className="mt-3 font-semibold text-[#1A2332]">Flexible Scheduling</h3>
              <p className="mt-1 text-sm text-[#556270]">Group sessions, squads, and private lessons to fit your week</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-[#2D8A4E]/10">
                <MapPin className="size-5 text-[#2D8A4E]" />
              </div>
              <h3 className="mt-3 font-semibold text-[#1A2332]">Great Venue</h3>
              <p className="mt-1 text-sm text-[#556270]">Somerton Park Tennis Club, 40 Wilton Ave, Somerton Park</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact / Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-[#E0D0BE]/50 bg-[#1A2332] px-4 py-12 text-white/70">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <Sun className="size-5 text-[#F7CD5D]" />
              <span className="font-semibold text-white">Sunrise Tennis</span>
            </div>
            <p className="mt-2 text-sm">
              Somerton Park Tennis Club<br />
              40 Wilton Ave, Somerton Park SA 5044
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 sm:items-end">
            <a href="tel:0431368752" className="flex items-center gap-2 text-sm transition-colors hover:text-white">
              <Phone className="size-4" />
              0431 368 752
            </a>
            <a href="https://instagram.com/sunrisetennis" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm transition-colors hover:text-white">
              <Instagram className="size-4" />
              @sunrisetennis
            </a>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-3xl justify-center gap-6 border-t border-white/10 pt-6 text-xs">
          <Link href="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link>
          <Link href="/terms" className="transition-colors hover:text-white">Terms of Service</Link>
        </div>
      </footer>
    </div>
  )
}
