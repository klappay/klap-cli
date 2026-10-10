export async function runUntilInterrupted(
  run: (signal: AbortSignal) => Promise<void>,
): Promise<void> {
  const controller = new AbortController()
  const onInterrupt = () => controller.abort()
  process.once('SIGINT', onInterrupt)
  try {
    await run(controller.signal)
  } catch (err) {
    if (!controller.signal.aborted) throw err
  } finally {
    process.off('SIGINT', onInterrupt)
  }
}
