/** Link a los resultados de búsqueda de YouTube para una canción (no hay audio embebido). */
export function youtubeSearchUrl(name: string, artists: string): string {
  const url = new URL('https://www.youtube.com/results')
  url.searchParams.set('search_query', `${name} ${artists}`)
  return url.toString()
}

/** Link a los resultados de búsqueda de Spotify para una canción (la ruta, no un query param). */
export function spotifySearchUrl(name: string, artists: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(`${name} ${artists}`)}`
}

/** Formatea un timestamp como "hace X min/h/d" para el historial de búsqueda. */
export function timeAgo(ts: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (diffSec < 60) return 'justo ahora'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `hace ${diffH} h`
  const diffD = Math.floor(diffH / 24)
  return `hace ${diffD} d`
}
