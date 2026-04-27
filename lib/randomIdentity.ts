const ADJECTIVES = ['Swift', 'Bright', 'Bold', 'Calm', 'Keen', 'Wise', 'Sharp', 'Quick', 'Cool', 'Sly']
const ANIMALS    = ['Fox', 'Owl', 'Bear', 'Wolf', 'Hawk', 'Lynx', 'Deer', 'Crow', 'Seal', 'Kite']

export function randomName(): string {
  const adj    = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  return `${adj} ${animal}`
}

export function randomHue(): number {
  return Math.floor(Math.random() * 360)
}
