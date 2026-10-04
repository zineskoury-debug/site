// Practical information about the shop. Edit here; the whole site reads from this file.
export const site = {
  name: 'Capriso',
  tagline: 'Passione per il gelato',
  city: 'Casablanca',
  address: {
    street: 'N°37 Résidence Fatine',
    district: 'Quartier Bachkou',
    city: 'Casablanca',
    country: 'MA',
    landmark: 'En face de Carrefour Taddart',
  },
  phone: '+212 618 401 509',
  phoneHref: 'tel:+212618401509',
  instagram: 'https://www.instagram.com/capriso_passionedigelato/',
  instagramHandle: '@capriso_passionedigelato',
  maps: 'https://www.google.com/maps/search/?api=1&query=Capriso+glacier+R%C3%A9sidence+Fatine+Bachkou+Casablanca',
  // Opening hours shown in the footer and in the structured data.
  hours: [
    { label: 'Lundi – Jeudi', value: '12h – 23h', days: ['Mo', 'Tu', 'We', 'Th'], opens: '12:00', closes: '23:00' },
    { label: 'Vendredi – Dimanche', value: '12h – 00h', days: ['Fr', 'Sa', 'Su'], opens: '12:00', closes: '00:00' },
  ],
} as const

export const navLinks = [
  { href: '#maison', label: 'La maison' },
  { href: '#parfums', label: 'Parfums' },
  { href: '#savoir-faire', label: 'Savoir-faire' },
  { href: '#contact', label: 'Contact' },
] as const

/** Resolve a file from /public whatever the deploy sub-path. */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
