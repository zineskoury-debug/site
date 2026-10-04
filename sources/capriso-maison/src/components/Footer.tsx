import { revealLines, scrollToTarget, useGsap } from '../animations/motion'
import { asset, site } from '../data/site'
import { SplitText } from './SplitText'

export function Footer() {
  const ref = useGsap<HTMLElement>(({ root, q }) => {
    revealLines(q('.line-inner'), root, { stagger: 0.12 }, 'top 75%')
  })

  return (
    <footer ref={ref} id="contact" data-theme="dark" className="relative z-10 overflow-hidden bg-cocoa px-[var(--gutter)] pt-[18vh] pb-8 text-ivory">
      <SplitText as="p" text={'À bientôt\npour une *glace.*'} className="display text-[clamp(3.6rem,11vw,12rem)] text-ivory" />

      <div className="mt-[14vh] grid gap-12 border-t border-ivory/15 pt-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <img src={asset('brand/logo-cream.webp')} alt={`${site.name}, ${site.tagline}`} width={520} height={184} loading="lazy" className="w-36" />
          <p className="lede mt-6 text-[1.2rem] text-ivory/80">Glaces artisanales.</p>
        </div>
        <address className="not-italic">
          <p className="eyebrow mb-4 text-vanilla">Adresse</p>
          <a href={site.maps} target="_blank" rel="noopener" className="ulink text-[0.95rem] leading-relaxed text-ivory/80">
            {site.address.street}
            <br />
            {site.address.district}, {site.address.city}
          </a>
          <p className="mt-2 text-sm text-ivory/60">{site.address.landmark}</p>
        </address>
        <div>
          <p className="eyebrow mb-4 text-vanilla">Horaires</p>
          <dl className="space-y-1 text-[0.95rem] text-ivory/80">
            {site.hours.map((h) => (
              <div key={h.label} className="flex justify-between gap-4">
                <dt>{h.label}</dt>
                <dd className="tabular-nums">{h.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <p className="eyebrow mb-4 text-vanilla">Contact</p>
          <ul className="space-y-1 text-[0.95rem] text-ivory/80">
            <li>
              <a className="ulink" href={site.phoneHref}>
                {site.phone}
              </a>
            </li>
            <li>
              <a className="ulink" href={site.instagram} target="_blank" rel="noopener">
                Instagram
              </a>
            </li>
            <li>
              <a className="ulink" href={site.maps} target="_blank" rel="noopener">
                Itinéraire
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-[10vh] flex flex-wrap items-center justify-between gap-4 text-xs text-ivory/60">
        <p>
          © {new Date().getFullYear()} {site.name} · {site.tagline}
        </p>
        <a
          href="#top"
          className="ulink eyebrow !text-[0.62rem] text-ivory/70"
          onClick={(e) => {
            e.preventDefault()
            scrollToTarget('#top')
          }}
        >
          Retour en haut ↑
        </a>
      </div>
    </footer>
  )
}
