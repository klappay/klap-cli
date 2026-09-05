import { describe, expect, it } from 'vitest'
import { formatConfirmationProgress } from './print'

describe('formatConfirmationProgress', () => {
  it('renders an empty bar at 0%', () => {
    const line = formatConfirmationProgress({
      network: 'base',
      percent: 0,
      blocksSeen: 0,
      blocksRequired: 12,
    })
    expect(line).toBe('[--------------------] 0%  base 0/12 blocks')
  })

  it('renders a full bar at 100%', () => {
    const line = formatConfirmationProgress({
      network: 'polygon',
      percent: 100,
      blocksSeen: 12,
      blocksRequired: 12,
    })
    expect(line).toBe('[####################] 100%  polygon 12/12 blocks')
  })

  it('rounds a partial percentage to the nearest bar segment', () => {
    const line = formatConfirmationProgress({
      network: 'ethereum',
      percent: 33,
      blocksSeen: 4,
      blocksRequired: 12,
    })
    expect(line).toBe('[#######-------------] 33%  ethereum 4/12 blocks')
  })
})
