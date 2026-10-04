import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ScrollTrigger, initSmoothScroll } from './animations/motion'
import { useVelocityFx } from './animations/velocity'
import { setZone } from './3d/stage'
import { loadTextureFonts } from './3d/fonts'
import { Cursor } from './components/Cursor'
import { Footer } from './components/Footer'
import { Nav } from './components/Nav'
import { Marquee } from './components/Marquee'
import { Preloader } from './components/Preloader'
import { ProgressCone } from './components/ProgressCone'
import { Sprinkles } from './components/Sprinkles'
import { Choose } from './sections/Choose'
import { Craft } from './sections/Craft'
import { FinalCta } from './sections/FinalCta'
import { Flavors } from './sections/Flavors'
import { Hero } from './sections/Hero'
import { Ingredients } from './sections/Ingredients'
import { Product } from './sections/Product'
import { Story } from './sections/Story'
import { Transformation } from './sections/Transformation'

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

// start downloading the 3D chunk immediately, in parallel with the page
const webgl = hasWebGL()
const experienceModule = webgl ? import('./3d/Experience') : null
const Experience = lazy(() => experienceModule ?? Promise.reject(new Error('WebGL unavailable')))

export default function App() {
  const [ready, setReady] = useState(false)
  const bg = useRef<HTMLDivElement>(null)
  const loading = useMemo(
    () => Promise.all([document.fonts.ready, loadTextureFonts(), experienceModule?.catch(() => null)]),
    [],
  )
  const onDone = useCallback(() => setReady(true), [])
  useVelocityFx(ready)

  useLayoutEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    return initSmoothScroll()
  }, [])

  // which 3D zone is on screen decides whether the canvas renders at all
  useEffect(() => {
    const story = ScrollTrigger.create({
      trigger: '#top',
      start: 'top bottom',
      endTrigger: '#transformation',
      end: 'bottom top',
      onToggle: (self) => setZone('storyOn', self.isActive),
    })
    const product = ScrollTrigger.create({
      trigger: '#notre-glace',
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        setZone('productOn', self.isActive)
        bg.current?.classList.toggle('is-dark', self.isActive)
      },
    })
    const refresh = () => ScrollTrigger.refresh()
    document.fonts.ready.then(refresh)
    return () => {
      story.kill()
      product.kill()
    }
  }, [])

  useEffect(() => {
    if (ready) ScrollTrigger.refresh()
  }, [ready])

  const onGlow = useCallback((v: number) => {
    bg.current?.style.setProperty('--glow', String(Math.sin(Math.min(1, v) * Math.PI)))
    bg.current?.style.setProperty('--prod', String(v))
  }, [])

  return (
    <>
      <Preloader ready={loading} onDone={onDone} />
      <Cursor />
      <Sprinkles />
      <Nav />

      {/* fixed stage: colour field + light, then the WebGL canvas */}
      <div ref={bg} className="stage-bg pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* giant words sliding behind the 3D tub (visible in the dark product chapter) */}
        <div className="stage-words display">
          <p>
            Gelato <em>artigianale</em> · Gelato <em>artigianale</em> ·
          </p>
          <p>
            <em>Pistacchio</em> · Capriso · <em>Pistacchio</em> · Capriso ·
          </p>
        </div>
      </div>
      {webgl && (
        <div className="pointer-events-none fixed inset-0 z-0">
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </div>
      )}

      <main id="main" className="relative z-10">
        <Hero ready={ready} webgl={webgl} />
        <Ingredients />
        <Transformation />
        <Flavors />
        <Product onGlow={onGlow} webgl={webgl} />
        <Craft />
        <Story />
        <Marquee />
        <Choose />
        <FinalCta />
      </main>
      <Footer />
      <ProgressCone />
    </>
  )
}
