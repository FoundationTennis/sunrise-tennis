import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Phone, Mail, Instagram, Facebook, ChevronRight, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Sunrise Tennis | Somerton Park, Adelaide',
  description:
    'Get in touch with Coach Maxim at Sunrise Tennis. Located at Somerton Park Tennis Club, 40 Wilton Ave, Somerton Park SA 5044. Call 0431 368 752.',
  alternates: { canonical: 'https://sunrisetennis.com.au/contact' },
  openGraph: {
    title: 'Contact Sunrise Tennis | Somerton Park, Adelaide',
    description:
      'Get in touch with Coach Maxim at Sunrise Tennis, Somerton Park Tennis Club.',
    url: 'https://sunrisetennis.com.au/contact',
    siteName: 'Sunrise Tennis',
    locale: 'en_AU',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Sunrise Tennis - Contact',
      },
    ],
  },
  twitter: { card: 'summary_large_image' },
}

const MAPS_EMBED_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3269.8!2d138.51!3d-34.99!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zU29tZXJ0b24gUGFyayBUZW5uaXMgQ2x1Yg!5e0!3m2!1sen!2sau!4v1713268800000'
const MAPS_LINK =
  'https://maps.google.com/?q=Somerton+Park+Tennis+Club+40+Wilton+Ave+Somerton+Park+SA+5044'

export default function ContactPage() {
  return (
    <div className="bg-gradient-to-b from-[#FFFBF7] via-[#FFF6ED] to-[#FFEAD8] px-4 pt-10 pb-16 sm:pt-14 sm:pb-20">
      <div className="mx-auto max-w-5xl">
        {/* Page header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E87450] to-[#F7CD5D] shadow-sm">
            <Phone className="size-6 text-white" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#1A2332] sm:text-4xl">
            Get in Touch
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#556270] sm:text-base">
            Call, text, or drop in at the courts. Coach Maxim handles every enquiry personally —
            usually back to you the same day.
          </p>
        </div>

        {/* Two-column body */}
        <div className="mt-10 grid gap-4 sm:mt-12 sm:gap-6 lg:grid-cols-5">
          {/* Map */}
          <div className="overflow-hidden rounded-2xl border border-[#E0D0BE]/40 bg-white shadow-sm lg:col-span-3">
            <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
              <iframe
                title="Somerton Park Tennis Club map"
                src={MAPS_EMBED_SRC}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full border-0"
                allowFullScreen
              />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[#E0D0BE]/30 bg-[#FFFBF7] px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1A2332]">Somerton Park Tennis Club</p>
                <p className="truncate text-xs text-[#556270]">40 Wilton Ave, Somerton Park SA 5044</p>
              </div>
              <a
                href={MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#2B5EA7] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1E4A88]"
              >
                Directions
                <ChevronRight className="size-3.5" />
              </a>
            </div>
          </div>

          {/* Contact card */}
          <div className="rounded-2xl border border-[#E0D0BE]/40 bg-white shadow-sm lg:col-span-2">
            {/* Accent strip */}
            <div className="h-1 rounded-t-2xl bg-gradient-to-r from-[#E87450] via-[#F5B041] to-[#F7CD5D]" />

            <ul className="divide-y divide-[#E0D0BE]/30">
              <ContactRow
                href="tel:0431368752"
                icon={<Phone className="size-5 text-[#E87450]" />}
                iconBg="bg-[#E87450]/10"
                label="Coach Maxim"
                value="0431 368 752"
                hint="Call or text — same day reply"
              />
              <ContactRow
                href="mailto:info@sunrisetennis.com.au"
                icon={<Mail className="size-5 text-[#2B5EA7]" />}
                iconBg="bg-[#2B5EA7]/10"
                label="Email"
                value="info@sunrisetennis.com.au"
                hint="For longer questions or enrolment queries"
              />
              <ContactRow
                href={MAPS_LINK}
                external
                icon={<MapPin className="size-5 text-[#2D8A4E]" />}
                iconBg="bg-[#2D8A4E]/10"
                label="Address"
                value="Somerton Park Tennis Club"
                hint="40 Wilton Ave, Somerton Park SA 5044"
              />
              <ContactRow
                icon={<Clock className="size-5 text-[#D4960A]" />}
                iconBg="bg-[#F5B041]/10"
                label="Session times"
                value="See weekly schedule"
                hint="20+ sessions Mon–Sat. Full times on the Programs page."
                href="/#programs"
              />
            </ul>

            {/* Socials */}
            <div className="flex items-center justify-between gap-2 border-t border-[#E0D0BE]/30 bg-[#FFFBF7] px-4 py-3 sm:px-5">
              <span className="text-xs font-medium tracking-wide text-[#8899A6] uppercase">Follow</span>
              <div className="flex items-center gap-2">
                <a
                  href="https://www.instagram.com/sunrisetennis"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-9 items-center justify-center rounded-full bg-white ring-1 ring-[#E0D0BE] transition-colors hover:bg-[#FFF6ED]"
                  aria-label="Instagram"
                >
                  <Instagram className="size-4 text-[#E87450]" />
                </a>
                <a
                  href="https://www.facebook.com/sunrisetennis"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-9 items-center justify-center rounded-full bg-white ring-1 ring-[#E0D0BE] transition-colors hover:bg-[#FFF6ED]"
                  aria-label="Facebook"
                >
                  <Facebook className="size-4 text-[#2B5EA7]" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl border border-[#E0D0BE]/40 bg-white/80 shadow-sm sm:mt-12">
          <div className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="text-base font-semibold text-[#1A2332] sm:text-lg">
                Prefer to book directly?
              </p>
              <p className="mt-0.5 text-sm text-[#556270]">
                Book a free trial session — no account needed.
              </p>
            </div>
            <Link
              href="/#trial"
              className="inline-flex shrink-0 items-center rounded-full bg-[#E87450] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#D06040]"
            >
              Book a Free Trial
              <ChevronRight className="ml-1 size-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContactRow({
  href,
  external,
  icon,
  iconBg,
  label,
  value,
  hint,
}: {
  href?: string
  external?: boolean
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  hint?: string
}) {
  const body = (
    <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium tracking-wide text-[#8899A6] uppercase">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-[#1A2332]">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-[#556270]">{hint}</p>}
      </div>
      {href && <ChevronRight className="mt-3 size-4 shrink-0 text-[#8899A6]" />}
    </div>
  )

  if (!href) return <li>{body}</li>
  if (external) {
    return (
      <li>
        <a href={href} target="_blank" rel="noopener noreferrer" className="block transition-colors hover:bg-[#FFF6ED]/60">
          {body}
        </a>
      </li>
    )
  }
  if (href.startsWith('/') || href.startsWith('#')) {
    return (
      <li>
        <Link href={href} className="block transition-colors hover:bg-[#FFF6ED]/60">
          {body}
        </Link>
      </li>
    )
  }
  return (
    <li>
      <a href={href} className="block transition-colors hover:bg-[#FFF6ED]/60">
        {body}
      </a>
    </li>
  )
}
