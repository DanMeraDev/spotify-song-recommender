import {
  BarChart3,
  Disc3,
  History,
  Lightbulb,
  PlayCircle,
  Search,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchRecommendations, fetchSongs } from './api'
import AudioRadarChart from './components/AudioRadarChart'
import CommunityView from './components/CommunityView'
import HistoryView from './components/HistoryView'
import InsightsView from './components/InsightsView'
import MoodMapChart from './components/MoodMapChart'
import Navbar, { type TabId } from './components/Navbar'
import Recommendations from './components/Recommendations'
import ScoreBreakdownChart from './components/ScoreBreakdownChart'
import SearchBar from './components/SearchBar'
import Sidebar, { type SectionId } from './components/Sidebar'
import SongList from './components/SongList'
import { MoodIcon } from './moods'
import type { HistoryEntry, RecommendationResponse, SongSummary } from './types'
import { spotifySearchUrl, youtubeSearchUrl } from './utils'

const BATCH_SIZE = 50
const DEBOUNCE_MS = 350
const HISTORY_KEY = 'soundmatch_search_history'
const HISTORY_LIMIT = 30

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

function loadHistoryFromStorage(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : []
  } catch {
    return []
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('explorer')
  const [lastSection, setLastSection] = useState<SectionId>('catalogo')
  const [pendingScrollId, setPendingScrollId] = useState<SectionId | null>(null)
  const [hint, setHint] = useState<string | null>(null)

  const [history, setHistory] = useState<HistoryEntry[]>(loadHistoryFromStorage)

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

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    } catch {
      // Almacenamiento no disponible (modo privado, cuota llena...): no es crítico.
    }
  }, [history])

  // Navegación del sidebar: cambia a la pestaña Explorador y hace scroll a la sección pedida.
  useEffect(() => {
    if (!pendingScrollId || activeTab !== 'explorer') return
    const el = document.getElementById(pendingScrollId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setHint('Selecciona una canción y busca sus recomendaciones para ver esta sección.')
      setTimeout(() => setHint(null), 2500)
    }
    setPendingScrollId(null)
  }, [pendingScrollId, activeTab])

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
      setHistory((prev) => {
        const entry: HistoryEntry = { ...song, ts: Date.now() }
        return [entry, ...prev.filter((h) => h.id !== song.id)].slice(0, HISTORY_LIMIT)
      })
    } catch (e) {
      setRecsError((e as Error).message)
    } finally {
      setLoadingRecs(false)
    }
  }

  function handleToggleDiscovery() {
    const next = !discovery
    setDiscovery(next)
    // Solo re-busca automáticamente si ya había una búsqueda hecha para esta canción.
    if (selectedSong && recommendation) loadRecommendations(selectedSong, next)
  }

  /** Selecciona una canción de la lista sin disparar la búsqueda todavía. */
  function handleSelectSong(song: SongSummary) {
    setSelectedSong(song)
    setRecommendation(null)
    setRecsError(null)
  }

  function handleSearchRecommendations() {
    if (selectedSong) loadRecommendations(selectedSong, discovery)
  }

  function handleNavigate(section: SectionId) {
    setLastSection(section)
    setActiveTab('explorer')
    setPendingScrollId(section)
  }

  function handleSelectFromHistory(entry: HistoryEntry) {
    setActiveTab('explorer')
    loadRecommendations(entry, discovery)
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar
        total={total}
        activeSection={activeTab === 'explorer' ? lastSection : null}
        onNavigate={handleNavigate}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedArtist={selectedSong?.artists}
        />

        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-6">
          {hint && (
            <div className="mb-4 rounded-lg border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-sm text-violet-200">
              {hint}
            </div>
          )}

          {activeTab === 'explorer' && (
            <>
              {/* Hero */}
              <section className="mb-6 overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-950/40 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 px-3 py-1 text-[11px] font-semibold tracking-wider text-violet-300 uppercase">
                      <Zap className="h-3 w-3" /> Motor de recomendación neuronal
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-50">
                      Recomendador Musical Multifactorial
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      Catálogo de {total.toLocaleString('es')} canciones ·{' '}
                      <span className="text-violet-300">
                        Score = 0.45·Audio + 0.25·Mood + 0.20·Género + 0.10·Popularidad
                      </span>
                    </p>
                  </div>
                  {selectedSong && (
                    <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-right">
                      <div className="text-[10px] tracking-wider text-zinc-500 uppercase">
                        Mood actual
                      </div>
                      <div className="flex items-center justify-end gap-1.5 text-sm font-medium text-violet-300">
                        <MoodIcon quadrant={selectedSong.mood_quadrant} className="h-4 w-4" />
                        {selectedSong.mood_quadrant}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Search */}
              <section className="mb-5">
                <SearchBar value={search} onChange={setSearch} />
              </section>

              {/* Song list */}
              <section id="catalogo" className="mb-8 scroll-mt-4">
                <p className="mb-2 text-sm text-zinc-400">
                  Haz clic en una canción para seleccionarla y luego presiona{' '}
                  <span className="font-medium text-zinc-200">Buscar recomendaciones</span>.
                </p>
                {songsError && <p className="mb-2 text-sm text-red-400">{songsError}</p>}
                <SongList
                  songs={songs}
                  selectedId={selectedSong?.id}
                  onSelect={handleSelectSong}
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
                  {/* Base song card */}
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-600/30">
                        <MoodIcon quadrant={selectedSong.mood_quadrant} className="h-6 w-6 text-violet-200" />
                      </div>
                      <div>
                        <div className="text-[10px] tracking-wider text-zinc-500 uppercase">
                          Canción base
                        </div>
                        <div className="text-lg font-semibold text-zinc-50">{selectedSong.name}</div>
                        <div className="text-sm text-zinc-400">{selectedSong.artists}</div>
                        <div className="mt-1 flex items-center gap-3">
                          <a
                            href={youtubeSearchUrl(selectedSong.name, selectedSong.artists)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400"
                          >
                            <PlayCircle className="h-3.5 w-3.5" /> YouTube
                          </a>
                          <a
                            href={spotifySearchUrl(selectedSong.name, selectedSong.artists)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-emerald-400"
                          >
                            <Disc3 className="h-3.5 w-3.5" /> Spotify
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSearchRecommendations}
                        disabled={loadingRecs}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Search className="h-4 w-4" />
                        {loadingRecs
                          ? 'Buscando...'
                          : recommendation
                            ? 'Buscar de nuevo'
                            : 'Buscar recomendaciones'}
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleDiscovery}
                        className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-left transition-colors hover:bg-zinc-800"
                      >
                        <div>
                          <div className="text-sm font-medium text-zinc-200">Modo descubrimiento</div>
                          <div className="text-[11px] text-zinc-500">
                            Favorece canciones menos populares
                          </div>
                        </div>
                        <span
                          className={`relative h-6 w-11 rounded-full transition-colors ${
                            discovery ? 'bg-violet-500' : 'bg-zinc-700'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                              discovery ? 'left-[22px]' : 'left-0.5'
                            }`}
                          />
                        </span>
                      </button>
                    </div>
                  </div>

                  {recsError && <p className="mb-2 text-sm text-red-400">{recsError}</p>}
                  {loadingRecs && (
                    <p className="text-sm text-zinc-400">Calculando recomendaciones...</p>
                  )}

                  {recommendation && !loadingRecs && (
                    <>
                      <div id="top5" className="scroll-mt-4">
                        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-zinc-100">
                          <Trophy className="h-5 w-5 text-amber-400" /> Top{' '}
                          {recommendation.recommendations.length} recomendaciones
                        </h2>
                        <Recommendations items={recommendation.recommendations} />
                      </div>

                      <div id="analisis" className="scroll-mt-4">
                        <h2 className="mt-8 mb-3 flex items-center gap-2 text-lg font-semibold text-zinc-100">
                          <BarChart3 className="h-5 w-5 text-violet-400" /> Análisis
                        </h2>
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
                      </div>
                    </>
                  )}
                </section>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-zinc-50">
                <History className="h-5 w-5 text-violet-400" /> Historial de búsqueda
              </h2>
              <HistoryView
                history={history}
                onSelect={handleSelectFromHistory}
                onClear={() => setHistory([])}
              />
            </div>
          )}

          {activeTab === 'insights' && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-zinc-50">
                <Lightbulb className="h-5 w-5 text-violet-400" /> Insights
              </h2>
              <InsightsView history={history} />
            </div>
          )}

          {activeTab === 'community' && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-zinc-50">
                <Users className="h-5 w-5 text-violet-400" /> Comunidad
              </h2>
              <CommunityView />
            </div>
          )}
        </main>

        <footer className="border-t border-zinc-800/80 px-6 py-4 text-center text-xs text-zinc-600">
          SoundMatch · Proyecto de Business Intelligence · Recomendación por filtrado basado en
          contenido
        </footer>
      </div>
    </div>
  )
}
