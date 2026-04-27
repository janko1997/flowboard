import { describe, it, expect } from 'vitest'
import { normalizeCoords, denormalizeCoords } from './cursorCoords'

const VW = 1440
const VH = 900

describe('normalizeCoords', () => {
  it('maps top-left corner to (0, 0)', () => {
    expect(normalizeCoords(0, 0, VW, VH)).toEqual({ x: 0, y: 0 })
  })

  it('maps bottom-right corner to (1, 1)', () => {
    expect(normalizeCoords(VW, VH, VW, VH)).toEqual({ x: 1, y: 1 })
  })

  it('maps centre to (0.5, 0.5)', () => {
    expect(normalizeCoords(VW / 2, VH / 2, VW, VH)).toEqual({ x: 0.5, y: 0.5 })
  })

  it('clamps values above 1 when cursor is at edge + scroll offset', () => {
    const result = normalizeCoords(VW + 100, VH + 50, VW, VH)
    expect(result.x).toBeGreaterThan(1)
    expect(result.y).toBeGreaterThan(1)
  })
})

describe('denormalizeCoords', () => {
  it('maps (0, 0) to top-left pixel', () => {
    expect(denormalizeCoords(0, 0, VW, VH)).toEqual({ x: 0, y: 0 })
  })

  it('maps (1, 1) to bottom-right pixel', () => {
    expect(denormalizeCoords(1, 1, VW, VH)).toEqual({ x: VW, y: VH })
  })

  it('maps (0.5, 0.5) to centre pixel', () => {
    expect(denormalizeCoords(0.5, 0.5, VW, VH)).toEqual({ x: 720, y: 450 })
  })
})

describe('round-trip', () => {
  it('normalizing then denormalizing returns the original coordinates', () => {
    const cases = [
      { x: 320, y: 240 },
      { x: 1200, y: 800 },
      { x: 0, y: 0 },
      { x: VW, y: VH },
    ]
    for (const { x, y } of cases) {
      const norm   = normalizeCoords(x, y, VW, VH)
      const result = denormalizeCoords(norm.x, norm.y, VW, VH)
      expect(result.x).toBeCloseTo(x)
      expect(result.y).toBeCloseTo(y)
    }
  })
})
