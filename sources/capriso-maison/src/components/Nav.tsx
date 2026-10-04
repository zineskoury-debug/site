import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger, getLenis, scrollToTarget } from '../animations/motion'
import { asset, navLinks, site } from '../data/site'

export function Nav() {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // discreet sticky header: hides when scrolling down, returns when scrolling up
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      if (Math.abs(y - last) > 6) {
        setHidden(y > last && y > 400)
        last = y
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // switch to light ink over dark sections
  useEffect(() => {
    const triggers = Array.from(document.querySelectorAll<HTMLElement>('[data-theme="dark"]')).map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: 'top 40px',
        end: 'bottom 40px',
        onToggle: () => {
          const any = ScrollTrigger.getAll().some((t) => t.vars.id === 'theme' && t.isActive)
          setDark(any)
          document.documentElement.classList.toggle('on-dark', any)
        },
        id: 'theme',
      }),
    )
    return () => triggers.forEach((t) => t.kill())
  }, [])

  useEffect(() => {
    const lenis = getLenis()
    if (open) {
      lenis?.stop()
      document.body.style.overflow = 'hidden'
      menuRef.current?.querySelector<HTMLElement>('a')?.focus()
    } else {
      lenis?.start()
      document.body.style.overflow = ''
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    // wait for the menu to start closing so the scroll is visible
    window.setTimeout(() => scrollToTarget(href), open ? 350 : 0)
  }

  const light = dark && !open

  return (
    <>
      <a
        href="#main"
        onClick={go('#main')}
        className="fixed top-3 left-3 z-[100] -translate-y-24 rounded-full bg-ink px-5 py-3 text-sm text-ivory focus:translate-y-0"
      >
        Aller au contenu
      </a>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,color,backdrop-filter] duration-700 ease-[var(--ease-out-expo)] ${
          hidden && !open ? '-translate-y-full' : ''
        } ${scrolled && !open ? (light ? 'bg-cocoa/55 backdrop-blur-md' : 'bg-cream/65 backdrop-blur-md') : ''} ${
          light ? 'text-ivory' : 'text-ink'
        }`}
      >
        <div className="mx-auto flex h-[var(--nav-h)] items-center justify-between px-[var(--gutter)]">
          <a href="#top" onClick={go('#top')} className="relative block h-9 w-[104px]" aria-label={`${site.name}, retour en haut de page`}>
            <img
              src={asset('brand/logo-wine.webp')}
              alt=""
              width={520}
              height={184}
              className={`absolute inset-0 h-full w-full object-contain object-left transition-opacity duration-500 ${light ? 'opacity-0' : ''}`}
            />
            <img
              src={asset('brand/logo-cream.webp')}
              alt=""
              width={520}
              height={184}
              className={`absolute inset-0 h-full w-full object-contain object-left transition-opacity duration-500 ${light ? '' : 'opacity-0'}`}
            />
          </a>
          <nav aria-label="Navigation principale" className="hidden md:block">
            <ul className="flex items-center gap-10">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={go(l.href)} className="ulink eyebrow !text-[0.7rem] pb-1">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <button
            ref={toggleRef}
            type="button"
            className="relative -mr-2 flex h-11 w-11 items-center justify-center md:hidden"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className={`absolute h-px w-6 bg-current transition-transform duration-500 ${open ? 'rotate-45' : '-translate-y-1'}`} />
            <span className={`absolute h-px w-6 bg-current transition-transform duration-500 ${open ? '-rotate-45' : 'translate-y-1'}`} />
          </button>
        </div>
      </header>

      <div
        id="mobile-menu"
        ref={menuRef}
        className={`menu fixed inset-0 z-40 flex flex-col justify-between bg-cream px-[var(--gutter)] pt-[calc(var(--nav-h)+2rem)] pb-10 md:hidden ${
          open ? 'is-open' : ''
        }`}
        aria-hidden={!open}
        inert={!open}
      >
        <nav aria-label="Menu mobile">
          <ul className="space-y-1">
            {navLinks.map((l, i) => (
              <li key={l.href} className="overflow-hidden" style={{ ['--i' as string]: i }}>
                <a href={l.href} onClick={go(l.href)} className="menu__link display block py-1 text-[clamp(3rem,15vw,5rem)]">
                  {i % 2 ? <em>{l.label}</em> : l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="menu__foot space-y-2 text-sm text-muted">
          <p>
            {site.address.street}, {site.address.district}
          </p>
          <p className="flex gap-6">
            <a className="ulink" href={site.instagram} target="_blank" rel="noopener">
              Instagram
            </a>
            <a className="ulink" href={site.phoneHref}>
              {site.phone}
            </a>
          </p>
        </div>
      </div>
    </>
  )
}
