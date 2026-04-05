import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

interface ImageHeroProps {
  src?: string
  alt?: string
  children: React.ReactNode
  className?: string
  overlayClassName?: string
}

export function ImageHero({ src, alt = '', children, className, overlayClassName }: ImageHeroProps) {
  return (
    <div className={cn('animate-fade-up relative overflow-hidden rounded-2xl shadow-elevated', className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 800px"
          priority
        />
      ) : null}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br from-[#2B5EA7]/85 via-[#6480A4]/75 to-[#E87450]/65',
        !src && 'from-[#2B5EA7] via-[#6480A4] to-[#E87450]',
        overlayClassName,
      )} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
      <div className="relative p-5 text-white">
        {children}
      </div>
    </div>
  )
}
