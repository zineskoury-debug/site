import { asset } from './site'

export type Product = {
  id: string
  name: string
  italian: string
  scoops: number
  price: string
  description: string
  image: string
  alt: string
}

// Prices in dirhams. Each serving comes in a cone or a cup.
export const products: Product[] = [
  {
    id: 'uno',
    name: 'Le cornet',
    italian: 'Uno',
    scoops: 1,
    price: '15 DH',
    description: 'Un parfum, un cornet croustillant. L’essentiel, tenu à la main.',
    image: asset('images/products/uno.webp'),
    alt: 'Cornet gaufré surmonté d’une boule de glace à la pistache',
  },
  {
    id: 'due',
    name: 'La coupe',
    italian: 'Due',
    scoops: 2,
    price: '25 DH',
    description: 'Deux parfums qui se répondent : un fruit et une crème, par exemple.',
    image: asset('images/products/due.webp'),
    alt: 'Coupe crème avec deux boules, fraise et vanille',
  },
  {
    id: 'tre',
    name: 'La gourmande',
    italian: 'Tre',
    scoops: 3,
    price: '35 DH',
    description: 'Trois parfums pour prendre son temps, ou pour partager.',
    image: asset('images/products/tre.webp'),
    alt: 'Coupe avec trois boules, chocolat, noisette et citron',
  },
]
