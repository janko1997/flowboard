import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PresenceBar } from './PresenceBar'

vi.mock('@/lib/liveblocks', () => ({
  useSelf:   vi.fn(),
  useOthers: vi.fn(),
}))

import { useSelf, useOthers } from '@/lib/liveblocks'

const mockSelf = (name: string, hue: number) => ({
  connectionId: 0,
  id:           undefined,
  presence:     { cursor: null, name, hue },
})

const mockOther = (connectionId: number, name: string, hue: number) => ({
  connectionId,
  id:       undefined,
  presence: { cursor: null, name, hue },
  info:     undefined,
})

beforeEach(() => {
  vi.mocked(useSelf).mockReturnValue(mockSelf('Bold Fox', 30) as any)
  vi.mocked(useOthers).mockReturnValue([] as any)
})

describe('PresenceBar', () => {
  it('renders the self avatar with "You" tooltip', () => {
    render(<PresenceBar />)
    expect(screen.getByTitle('You')).toBeInTheDocument()
  })

  it('renders one avatar per connected user', () => {
    vi.mocked(useOthers).mockReturnValue([
      mockOther(1, 'Swift Owl', 60),
      mockOther(2, 'Keen Bear', 120),
    ] as any)

    render(<PresenceBar />)

    expect(screen.getByTitle('You')).toBeInTheDocument()
    expect(screen.getByTitle('Swift Owl')).toBeInTheDocument()
    expect(screen.getByTitle('Keen Bear')).toBeInTheDocument()
    expect(screen.queryByTestId('presence-overflow')).toBeNull()
  })

  it('caps visible avatars at 5 and shows overflow badge for the rest', () => {
    vi.mocked(useOthers).mockReturnValue([
      mockOther(1, 'Swift Owl', 60),
      mockOther(2, 'Keen Bear', 120),
      mockOther(3, 'Calm Wolf', 200),
      mockOther(4, 'Wise Hawk', 280),
      mockOther(5, 'Sly Crow', 320),  // 6th user total
    ] as any)

    render(<PresenceBar />)

    const bar = screen.getByTestId('presence-bar')
    // Only 5 avatars rendered (self + 4 others)
    expect(bar.querySelectorAll('[title]')).toHaveLength(5)
    expect(screen.getByTestId('presence-overflow')).toHaveTextContent('+1')
  })

  it('overflow count scales correctly with many users', () => {
    vi.mocked(useOthers).mockReturnValue([
      mockOther(1, 'A', 10),
      mockOther(2, 'B', 20),
      mockOther(3, 'C', 30),
      mockOther(4, 'D', 40),
      mockOther(5, 'E', 50),
      mockOther(6, 'F', 60),
      mockOther(7, 'G', 70),
    ] as any)

    render(<PresenceBar />)

    expect(screen.getByTestId('presence-overflow')).toHaveTextContent('+3')
  })

  it('renders nothing when self is null (room not yet connected)', () => {
    vi.mocked(useSelf).mockReturnValue(null)

    render(<PresenceBar />)

    const bar = screen.getByTestId('presence-bar')
    expect(bar.querySelectorAll('[title]')).toHaveLength(0)
    expect(screen.queryByTestId('presence-overflow')).toBeNull()
  })
})
