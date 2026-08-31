import { ImageResponse } from 'next/og'

export const alt = 'Rentlify Solutions, digital solutions without the heavy upfront cost'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'stretch',
        background: '#f8f3eb',
        color: '#24152d',
        display: 'flex',
        fontFamily: 'Arial, sans-serif',
        height: '100%',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 68px',
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: 18 }}>
          <div
            style={{
              alignItems: 'center',
              background: '#6d35b4',
              color: '#ffffff',
              display: 'flex',
              fontSize: 30,
              fontWeight: 800,
              height: 58,
              justifyContent: 'center',
              width: 58,
            }}
          >
            R
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 28, fontWeight: 800 }}>Rentlify</span>
            <span style={{ color: '#6d35b4', fontSize: 13, fontWeight: 700, letterSpacing: 4 }}>SOLUTIONS</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: '#6d35b4', fontSize: 17, fontWeight: 700, letterSpacing: 3 }}>
            RENT YOUR DIGITAL BUSINESS
          </div>
          <div
            style={{ fontSize: 66, fontWeight: 800, letterSpacing: -4, lineHeight: 0.96, marginTop: 22, maxWidth: 790 }}
          >
            Digital solutions without the heavy upfront cost.
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 20, fontWeight: 600 }}>
          Mobile Apps&nbsp;&nbsp;·&nbsp;&nbsp;Websites&nbsp;&nbsp;·&nbsp;&nbsp;Business Software
        </div>
      </div>

      <div
        style={{
          background: '#6d35b4',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 48px',
          width: 235,
        }}
      >
        <div style={{ background: '#f5c84c', height: 72, width: 72 }} />
        <div style={{ color: '#ffffff', display: 'flex', fontSize: 25, fontWeight: 700, lineHeight: 1.2 }}>
          We build it.
          <br />
          We brand it.
          <br />
          You rent it.
        </div>
      </div>
    </div>,
    size,
  )
}
