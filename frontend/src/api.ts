import type { RecommendationResponse, SongListResponse } from './types'

const BASE = '/api'

export async function fetchSongs(params: {
  search?: string
  offset?: number
  limit?: number
}): Promise<SongListResponse> {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.offset !== undefined) qs.set('offset', String(params.offset))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))

  const res = await fetch(`${BASE}/songs?${qs.toString()}`)
  if (!res.ok) throw new Error('No se pudo cargar el catálogo de canciones.')
  return res.json()
}

export async function fetchRecommendations(
  songId: string,
  opts: { topN?: number; discovery?: boolean } = {},
): Promise<RecommendationResponse> {
  const qs = new URLSearchParams()
  if (opts.topN !== undefined) qs.set('top_n', String(opts.topN))
  if (opts.discovery) qs.set('discovery', 'true')

  const res = await fetch(`${BASE}/recommend/${songId}?${qs.toString()}`)
  if (!res.ok) throw new Error('No se pudo calcular la recomendación.')
  return res.json()
}
