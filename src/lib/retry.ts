const DEFAULT_DELAY = 1000
const DEFAULT_ATTEMPTS = 3

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { attempts?: number; delay?: number } = {}
): Promise<T> {
  const { attempts = DEFAULT_ATTEMPTS, delay = DEFAULT_DELAY } = options
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastError
}
