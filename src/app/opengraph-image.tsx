import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Sunrise Tennis - Junior Tennis Coaching Adelaide'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1A2332 0%, #2B5EA7 50%, #E87450 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Sun icon circle */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#F7CD5D',
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          Sunrise Tennis
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            marginTop: 16,
            maxWidth: 800,
          }}
        >
          Junior Tennis Coaching in Adelaide
        </div>

        {/* Details line */}
        <div
          style={{
            fontSize: 20,
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            marginTop: 12,
            display: 'flex',
            gap: 24,
          }}
        >
          <span>Ages 3-18</span>
          <span>·</span>
          <span>Somerton Park Tennis Club</span>
          <span>·</span>
          <span>Game-Based Coaching</span>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(90deg, #E87450, #F5B041, #F7CD5D)',
          }}
        />
      </div>
    ),
    { ...size },
  )
}
