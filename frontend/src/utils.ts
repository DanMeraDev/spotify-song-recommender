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
