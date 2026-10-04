import { asset } from './site'

export type FlavorId = 'pistacchio' | 'vaniglia' | 'cioccolato' | 'fragola' | 'limone' | 'nocciola'

export type Flavor = {
  id: FlavorId
  name: string
  italian: string
  description: string
  ingredients: string[]
  /** Background tint behind the product image. */
  tint: string
  /** Text colour that reads on the tint. */
  ink: string
  /** Product still. Replace with a photograph of the same name to update the site. */
  image: string
  /** Colours used to paint the 3D gelato. */
  gelato: {
    base: string
    speck?: string
    ripple?: string
    roughness: number
  }
}

export const flavors: Flavor[] = [
  {
    id: 'pistacchio',
    name: 'Pistache',
    italian: 'Pistacchio',
    description: 'Une pâte de pistache torréfiée, rien d’autre. Le goût vert, profond, presque salé du fruit sec.',
    ingredients: ['Pistache torréfiée', 'Lait entier', 'Sucre de canne'],
    tint: '#dfe0c3',
    ink: '#3d4321',
    image: asset('images/flavors/pistacchio.webp'),
    gelato: { base: '#b4b97e', speck: '#7f8a45', roughness: 0.62 },
  },
  {
    id: 'vaniglia',
    name: 'Vanille',
    italian: 'Vaniglia',
    description: 'Des gousses fendues à la main et infusées toute une nuit dans la crème. Douce, florale, constellée de grains.',
    ingredients: ['Gousse de vanille', 'Crème fraîche', 'Jaune d’œuf'],
    tint: '#f3e6c4',
    ink: '#5a4316',
    image: asset('images/flavors/vaniglia.webp'),
    gelato: { base: '#f3e4bd', speck: '#2b1a10', roughness: 0.6 },
  },
  {
    id: 'cioccolato',
    name: 'Chocolat',
    italian: 'Cioccolato',
    description: 'Un cacao noir intense, monté sans crème pour garder toute sa netteté. Fondant, amer juste ce qu’il faut.',
    ingredients: ['Cacao noir 70 %', 'Lait entier', 'Pointe de sel'],
    tint: '#d7c1b0',
    ink: '#2a1913',
    image: asset('images/flavors/cioccolato.webp'),
    gelato: { base: '#5b3424', speck: '#2c160e', roughness: 0.5 },
  },
  {
    id: 'fragola',
    name: 'Fraise',
    italian: 'Fragola',
    description: 'Des fraises mûres écrasées le matin même, à peine sucrées. Le goût d’un marché d’été.',
    ingredients: ['Fraises fraîches', 'Citron', 'Sucre de canne'],
    tint: '#f2d3d2',
    ink: '#6a1f2a',
    image: asset('images/flavors/fragola.webp'),
    gelato: { base: '#eba1a6', speck: '#b8384a', ripple: '#c94a5a', roughness: 0.56 },
  },
  {
    id: 'limone',
    name: 'Citron',
    italian: 'Limone',
    description: 'Un sorbet vif au citron pressé et au zeste. Sans lait, frais comme une ombre en août.',
    ingredients: ['Citron pressé', 'Zeste', 'Eau de source'],
    tint: '#f4ecc0',
    ink: '#5a4a0d',
    image: asset('images/flavors/limone.webp'),
    gelato: { base: '#f4eaa8', speck: '#e3c64e', roughness: 0.48 },
  },
  {
    id: 'nocciola',
    name: 'Noisette',
    italian: 'Nocciola',
    description: 'Des noisettes grillées lentement puis broyées en pâte. Rond, toasté, terriblement gourmand.',
    ingredients: ['Noisettes grillées', 'Lait entier', 'Sucre de canne'],
    tint: '#ead7c0',
    ink: '#4a2c17',
    image: asset('images/flavors/nocciola.webp'),
    gelato: { base: '#c99d72', speck: '#8d5e36', roughness: 0.6 },
  },
]

export const flavorById = (id: FlavorId) => flavors.find((f) => f.id === id)!
