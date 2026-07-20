import type { RecommendedSong } from '../types'

interface Factor {
  key: 'sim_audio' | 'sim_mood' | 'sim_genre' | 'sim_pop'
  label: string
  weight: number
  color: string
  natural: (pct: number) => string
}

// Colores en paleta fría/morada (coherente con el tema, sin verde tipo Spotify).
const FACTORS: Factor[] = [
  {
    key: 'sim_audio',
    label: 'Audio',
    weight: 0.45,
    color: '#a855f7',
    natural: (p) => `Suena ${p}% parecida a tu canción base`,
  },
  {
    key: 'sim_mood',
    label: 'Mood',
    weight: 0.25,
    color: '#6366f1',
    natural: (p) => `Tiene ${p}% de vibras similares a tu canción base`,
  },
  {
    key: 'sim_genre',
    label: 'Género',
    weight: 0.2,
    color: '#22d3ee',
    natural: (p) => `${p}% de coincidencia de género`,
  },
  {
    key: 'sim_pop',
    label: 'Popularidad',
    weight: 0.1,
    color: '#ec4899',
    natural: (p) => `El artista tiene ${p}% de popularidad`,
  },
]

function FactorBar({ song }: { song: RecommendedSong }) {
  const match = Math.round(song.score * 100)
  const segments = FACTORS.map((f) => ({
    ...f,
    width: song[f.key] * f.weight * 100, // aporte al score (las partes suman = match)
    rawPct: Math.round(song[f.key] * 100), // afinidad cruda del factor (para el hover)
  }))
  const remainder = Math.max(0, 100 - segments.reduce((s, seg) => s + seg.width, 0))
  const hasRemainder = remainder > 0.5

  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-2">
        <span className="truncate text-sm text-zinc-300" title={`${song.name} — ${song.artists}`}>
          {song.name}
        </span>
        <span className="shrink-0 text-sm">
          <span className="font-bold text-violet-400">{match}%</span>{' '}
          <span className="text-xs text-zinc-500">de coincidencia contigo</span>
        </span>
      </div>

      <div className="flex h-9 w-full rounded-lg bg-zinc-800/50 text-xs font-medium text-white">
        {segments.map((seg, idx) => (
          <div
            key={seg.label}
            style={{ width: `${seg.width}%`, backgroundColor: seg.color }}
            className={`group relative flex items-center justify-center overflow-visible ${
              idx === 0 ? 'rounded-l-lg' : ''
            } ${!hasRemainder && idx === segments.length - 1 ? 'rounded-r-lg' : ''}`}
          >
            {seg.width > 12 && <span className="truncate px-1">{seg.label}</span>}
            <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-56 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-800 p-2.5 text-center text-xs leading-snug font-normal text-zinc-100 shadow-xl group-hover:block">
              <span className="font-semibold" style={{ color: seg.color }}>
                {seg.label}
              </span>
              <br />
              {seg.natural(seg.rawPct)}
            </div>
          </div>
        ))}
        {hasRemainder && <div style={{ width: `${remainder}%` }} className="rounded-r-lg" />}
      </div>
    </div>
  )
}

export default function ScoreBreakdownChart({ items }: { items: RecommendedSong[] }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="text-base font-medium text-zinc-100">¿Por qué se recomendó?</h3>
      <p className="mt-0.5 mb-4 text-xs text-zinc-500">
        Pasa el mouse sobre cada color para ver cuánto influyó ese factor.
      </p>

      <div className="flex flex-col gap-4">
        {items.map((song) => (
          <FactorBar key={song.id} song={song} />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-zinc-800 pt-4 text-xs text-zinc-400">
        {FACTORS.map((f) => (
          <span key={f.label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: f.color }} />
            {f.label}
          </span>
        ))}
      </div>
    </div>
  )
}
