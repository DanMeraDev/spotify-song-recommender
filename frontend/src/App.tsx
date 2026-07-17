import { useEffect, useState } from 'react'
import { fetchRecommendations, fetchSongs } from './api'
import AudioRadarChart from './components/AudioRadarChart'
import MoodMapChart from './components/MoodMapChart'
import Recommendations from './components/Recommendations'
import ScoreBreakdownChart from './components/ScoreBreakdownChart'
import SearchBar from './components/SearchBar'
import SongList from './components/SongList'
import type { RecommendationResponse, SongSummary } from './types'
import { spotifySearchUrl, youtubeSearchUrl } from './utils'

const BATCH_SIZE = 50
const DEBOUNCE_MS = 350

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

export default function App() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, DEBOUNCE_MS)
  const isSearching = debouncedSearch.trim().length > 0

  const [songs, setSongs] = useState<SongSummary[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(BATCH_SIZE)
  const [loadingSongs, setLoadingSongs] = useState(false)
  const [songsError, setSongsError] = useState<string | null>(null)

  const [selectedSong, setSelectedSong] = useState<SongSummary | null>(null)
  const [discovery, setDiscovery] = useState(false)
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null)
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [recsError, setRecsError] = useState<string | null>(null)

  // Carga inicial y cada vez que cambia el término de búsqueda (con debounce).
  useEffect(() => {
    let cancelled = false
    setLoadingSongs(true)
    setSongsError(null)
    fetchSongs({ search: debouncedSearch, offset: 0, limit: BATCH_SIZE })
      .then((res) => {
        if (cancelled) return
        setSongs(res.items)
        setTotal(res.total)
        setOffset(BATCH_SIZE)
      })
      .catch((e: Error) => !cancelled && setSongsError(e.message))
      .finally(() => !cancelled && setLoadingSongs(false))
    return () => {
      cancelled = true
    }
  }, [debouncedSearch])

  async function handleLoadMore() {
    setLoadingSongs(true)
    try {
      const res = await fetchSongs({ search: debouncedSearch, offset, limit: BATCH_SIZE })
      setSongs((prev) => [...prev, ...res.items])
      setOffset((prev) => prev + BATCH_SIZE)
    } catch (e) {
      setSongsError((e as Error).message)
    } finally {
      setLoadingSongs(false)
    }
  }

  async function loadRecommendations(song: SongSummary, discoveryMode: boolean) {
    setSelectedSong(song)
    setLoadingRecs(true)
    setRecsError(null)
    try {
      const res = await fetchRecommendations(song.id, { topN: 5, discovery: discoveryMode })
      setRecommendation(res)
    } catch (e) {
      setRecsError((e as Error).message)
    } finally {
      setLoadingRecs(false)
    }
  }

  function handleToggleDiscovery() {
    const next = !discovery
    setDiscovery(next)
    if (selectedSong) loadRecommendations(selectedSong, next)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-50">
            🎵 Recomendador Musical Multifactorial
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Catálogo de {total.toLocaleString('es')} canciones · Score = 0.45·Audio + 0.25·Mood +
            0.20·Género + 0.10·Popularidad
          </p>
        </header>

        <section className="mb-4">
          <SearchBar value={search} onChange={setSearch} />
        </section>

        <section className="mb-8">
          <p className="mb-2 text-sm text-zinc-400">
            Haz clic en una canción de la lista para ver sus recomendaciones.
          </p>
          {songsError && <p className="mb-2 text-sm text-red-400">{songsError}</p>}
          <SongList
            songs={songs}
            selectedId={selectedSong?.id}
            onSelect={(song) => loadRecommendations(song, discovery)}
            loading={loadingSongs && songs.length === 0}
          />
          {!isSearching && offset < total && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingSongs}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                {loadingSongs ? 'Cargando...' : `Ver más (${BATCH_SIZE})`}
              </button>
            </div>
          )}
        </section>

        {selectedSong && (
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div>
                <div className="text-xs tracking-wide text-zinc-500 uppercase">Canción base</div>
                <div className="text-lg font-medium text-zinc-100">{selectedSong.name}</div>
                <div className="text-sm text-zinc-400">{selectedSong.artists}</div>
                <div className="mt-1 flex items-center gap-3">
                  <a
                    href={youtubeSearchUrl(selectedSong.name, selectedSong.artists)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400"
                  >
                    ▶ YouTube
                  </a>
                  <a
                    href={spotifySearchUrl(selectedSong.name, selectedSong.artists)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-green-400"
                  >
                    ● Spotify
                  </a>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={discovery}
                  onChange={handleToggleDiscovery}
                  className="h-4 w-4 accent-green-500"
                />
                Modo descubrimiento (favorece canciones menos populares)
              </label>
            </div>

            {recsError && <p className="mb-2 text-sm text-red-400">{recsError}</p>}
            {loadingRecs && (
              <p className="text-sm text-zinc-400">Calculando recomendaciones...</p>
            )}

            {recommendation && !loadingRecs && (
              <>
                <h2 className="mb-3 text-lg font-medium text-zinc-100">
                  🏆 Top {recommendation.recommendations.length} recomendaciones
                </h2>
                <Recommendations items={recommendation.recommendations} />

                <h2 className="mt-8 mb-3 text-lg font-medium text-zinc-100">📊 Análisis</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  <AudioRadarChart
                    query={recommendation.query}
                    recommendations={recommendation.recommendations}
                  />
                  <MoodMapChart
                    query={recommendation.query}
                    recommendations={recommendation.recommendations}
                  />
                </div>
                <div className="mt-4">
                  <ScoreBreakdownChart items={recommendation.recommendations} />
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
