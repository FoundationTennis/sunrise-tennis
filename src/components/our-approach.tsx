import { Heart, Gamepad2, Users } from 'lucide-react'

const PILLARS = [
  {
    icon: Heart,
    title: 'Feel over formula',
    description:
      "Every player is read individually. We coach what this child needs today — not what a lesson plan says week 4 looks like.",
  },
  {
    icon: Gamepad2,
    title: 'Play is the method',
    description:
      'Games, constraints, decisions. Skill transfers faster when it\'s earned under real play pressure, not drilled in isolation.',
  },
  {
    icon: Users,
    title: 'Everyone matters',
    description:
      "Red-ball five-year-olds get the same attention as squad players. The level isn't the product — the child's growth is.",
  },
]

export function OurApproach() {
  return (
    <section id="approach" className="scroll-mt-20 bg-[#FFFBF7] px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1A2332] sm:text-3xl">Our Approach</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[#556270]">
            We coach through feel, not formula — every player read individually, every session built around play.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-6">
          {PILLARS.map((pillar, i) => (
            <div
              key={pillar.title}
              className="relative overflow-hidden rounded-xl border border-[#E0D0BE]/40 bg-white p-5 shadow-sm transition-all hover:shadow-md sm:p-6"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Left accent bar — gradient-horizon */}
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-[#E87450] via-[#F5B041] to-[#F7CD5D]" />

              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E87450]/15 to-[#F7CD5D]/15 sm:size-12">
                <pillar.icon className="size-5 text-[#E87450] sm:size-6" />
              </div>

              <h3 className="mt-4 text-base font-semibold text-[#1A2332] sm:text-lg">{pillar.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#556270]">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
