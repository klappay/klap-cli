import { describe, expect, it } from 'vitest'
import { parseListRecipientsOptions } from './recipients'

describe('parseListRecipientsOptions', () => {
  it('defaults the page size when no flag is passed', () => {
    expect(parseListRecipientsOptions({})).toEqual({ limit: 20 })
  })

  it('coerces --limit from its string form and keeps --cursor', () => {
    expect(parseListRecipientsOptions({ limit: '50', cursor: 'abc' })).toEqual({
      limit: 50,
      cursor: 'abc',
    })
  })

  it('names the flag when --limit is out of range', () => {
    expect(() => parseListRecipientsOptions({ limit: '1000' })).toThrow(/--limit/)
  })

  it('names the flag when --limit is not a number', () => {
    expect(() => parseListRecipientsOptions({ limit: 'many' })).toThrow(/--limit/)
  })
})
