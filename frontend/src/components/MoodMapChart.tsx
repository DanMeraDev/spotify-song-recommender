import { Music2 } from 'lucide-react'
import { QUADRANTS } from '../moods'
import type { RecommendedSong, SongDetail } from '../types'
import InfoHint from './InfoHint'

interface Props {
  query: SongDetail
  recommendations: RecommendedSong[]
}

// Posición dentro del cuadro: X = valence (0 izq → 1 der), Y = energy (1 arriba → 0 abajo).
const clamp = (v: number) => Math.max(6, Math.min(94, v))
const xOf = (valence: number) => clamp(valence * 100)
const yOf = (energy: number) => clamp((1 - energy) * 100)

const CORNER_POSITION: Record<'tl' | 'tr' | 'bl' | 'br', string> = {
  tl: 'top-7 left-3 text-left items-start',
  tr: 'top-7 right-3 text-right items-end',
  bl: 'bottom-7 left-3 text-left items-start',
  br: 'right-3 bottom-7 text-right items-end',
}

export default function MoodMapChart({ query, recommendations }: Props) {
  const qx = xOf(query.valence)
  const qy = yOf(query.energy)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium text-zinc-200">Mapa de moods</h3>
          <InfoHint text="Cada canción se ubica según su energía (arriba = más intensa) y su valence (derecha = más positiva). Las recomendadas caen cerca de tu canción." />
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-400" /> Recomendadas
          </span>
          <span className="flex items-center gap-1">
            <Music2 className="h-3.5 w-3.5" /> Tu canción
          </span>
        </div>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-xl border border-zinc-800">
        {/* Tintes de los 4 cuadrantes */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          <div className="bg-rose-500/10" />
          <div className="bg-amber-500/10" />
          <div className="bg-indigo-500/10" />
          <div className="bg-emerald-500/10" />
        </div>

        {/* Ejes centrales */}
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-700/60" />
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-zinc-700/60" />

        {/* Etiquetas de ritmo (ejes) */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap text-zinc-500">
          Ritmo: Rápido / Enérgico
        </div>
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap text-zinc-500">
          Ritmo: Suave / Tranquilo
        </div>

        {/* Etiquetas de cuadrante */}
        {QUADRANTS.map((q) => (
          <div
            key={q.key}
            className={`pointer-events-none absolute flex flex-col ${CORNER_POSITION[q.corner]}`}
          >
            <q.icon className={`h-4 w-4 ${q.color}`} />
            <div className={`mt-0.5 text-xs font-semibold ${q.color}`}>{q.title}</div>
            <div className="text-[10px] text-zinc-500">{q.desc}</div>
          </div>
        ))}

        {/* Líneas que conectan tu canción con cada recomendada */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {recommendations.map((r) => (
            <line
              key={r.id}
              x1={qx}
              y1={qy}
              x2={xOf(r.valence)}
              y2={yOf(r.energy)}
              stroke="#a855f7"
              strokeWidth={0.4}
              strokeOpacity={0.4}
            />
          ))}
        </svg>

        {/* Puntos de las recomendadas */}
        {recommendations.map((r) => (
          <div
            key={r.id}
            title={`${r.name} — ${r.artists}`}
            style={{ left: `${xOf(r.valence)}%`, top: `${yOf(r.energy)}%` }}
            className="absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400 shadow-[0_0_8px_2px_rgba(168,85,247,0.7)] ring-2 ring-violet-300/40"
          />
        ))}

        {/* Marcador de tu canción */}
        <div
          title={`${query.name} — ${query.artists}`}
          style={{ left: `${qx}%`, top: `${qy}%` }}
          className="absolute z-20 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-amber-400"
        >
          <Music2 className="h-3.5 w-3.5 text-zinc-900" />
        </div>
      </div>
    </div>
  )
}
