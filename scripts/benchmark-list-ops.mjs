/**
 * Benchmarks in-memory list operations used by ProxyChecker.
 * Run: npm run benchmark:perf
 */

const PROXY_COUNT = 10_000
const FILTER_QUERY = '192.168'
const SORT_FIELD = 'latency'
const ITERATIONS = 20

function createSyntheticProxy(index) {
  return {
    id: `proxy-${index}`,
    protocol: index % 2 === 0 ? 'http' : 'socks5',
    host: `192.168.${Math.floor(index / 256) % 256}.${index % 256}`,
    port: 8000 + (index % 1000),
    label: `Proxy ${index}`,
    isEnabled: index % 3 !== 0,
    isFavorite: index % 7 === 0,
    status: index % 5 === 0 ? 'alive' : index % 5 === 1 ? 'dead' : 'unknown',
    latencyMs: index % 5 === 0 ? 100 + (index % 400) : undefined,
    createdAt: new Date(Date.now() - index * 60_000).toISOString(),
    checkedAt: index % 4 === 0 ? new Date().toISOString() : undefined,
    countryCode: 'US',
    city: 'City'
  }
}

function buildHaystack(proxy) {
  return [proxy.label, proxy.host, String(proxy.port), proxy.protocol, proxy.status]
    .join(' ')
    .toLowerCase()
}

function filterProxies(proxies, query) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return proxies

  return proxies.filter((proxy) => buildHaystack(proxy).includes(normalizedQuery))
}

function sortProxies(proxies, field) {
  return [...proxies].sort((left, right) => {
    const leftValue = left[field]
    const rightValue = right[field]

    if (leftValue == null && rightValue == null) return 0
    if (leftValue == null) return 1
    if (rightValue == null) return -1

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return leftValue - rightValue
    }

    return String(leftValue).localeCompare(String(rightValue))
  })
}

function applyLiveProgress(proxies, proxyId) {
  const index = proxies.findIndex((proxy) => proxy.id === proxyId)
  if (index === -1) return proxies

  const next = proxies.slice()
  next[index] = {
    ...next[index],
    status: 'checking'
  }
  return next
}

function benchmark(name, fn) {
  const start = performance.now()
  let result

  for (let i = 0; i < ITERATIONS; i += 1) {
    result = fn()
  }

  const elapsed = performance.now() - start
  const perRun = elapsed / ITERATIONS

  console.log(`${name}: ${perRun.toFixed(2)} ms/run (${ITERATIONS} iterations)`)
  return result
}

const proxies = Array.from({ length: PROXY_COUNT }, (_, index) => createSyntheticProxy(index))

console.log(`ProxyChecker list benchmark (${PROXY_COUNT} proxies)\n`)

benchmark('filterProxies (search)', () => filterProxies(proxies, FILTER_QUERY))
benchmark('sortProxies (latency)', () => sortProxies(proxies, SORT_FIELD))
benchmark('applyLiveProgress (single update)', () =>
  applyLiveProgress(proxies, proxies[Math.floor(PROXY_COUNT / 2)].id)
)

const filtered = filterProxies(proxies, FILTER_QUERY)
console.log(`\nFiltered count: ${filtered.length}`)
