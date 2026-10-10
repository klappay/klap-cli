import { afterEach, describe, expect, it } from 'vitest'
import { runUntilInterrupted } from './interrupt'

function untilAborted(signal: AbortSignal): Promise<void> {
  return new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () =>
      reject(new DOMException('This operation was aborted', 'AbortError')),
    )
  })
}

const baselineListeners = process.listenerCount('SIGINT')

afterEach(() => {
  expect(process.listenerCount('SIGINT')).toBe(baselineListeners)
})

describe('runUntilInterrupted', () => {
  it('resolves quietly when Ctrl+C aborts a running stream', async () => {
    const running = runUntilInterrupted(untilAborted)
    process.emit('SIGINT')
    await expect(running).resolves.toBeUndefined()
  })

  it('passes the signal that Ctrl+C aborts', async () => {
    let seen: AbortSignal | undefined
    const running = runUntilInterrupted((signal) => {
      seen = signal
      return untilAborted(signal)
    })
    expect(seen?.aborted).toBe(false)
    process.emit('SIGINT')
    await running
    expect(seen?.aborted).toBe(true)
  })

  it('rethrows an error that happens without Ctrl+C', async () => {
    await expect(
      runUntilInterrupted(async () => {
        throw new Error('stream closed by server')
      }),
    ).rejects.toThrow('stream closed by server')
  })

  it('rethrows an AbortError that did not come from Ctrl+C', async () => {
    await expect(
      runUntilInterrupted(async () => {
        throw new DOMException('This operation was aborted', 'AbortError')
      }),
    ).rejects.toThrow('This operation was aborted')
  })

  it('resolves when the stream ends on its own', async () => {
    await expect(runUntilInterrupted(async () => {})).resolves.toBeUndefined()
  })
})
