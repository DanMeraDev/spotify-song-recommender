import { Music2, Palette, Search, Star } from 'lucide-react'
import type { HistoryEntry } from '../types'

function mostCommon(values: string[]): string | null {
  if (values.length === 0) return null
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

export default function InsightsView({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-400">
        Consulta algunas canciones en <span className="font-medium text-violet-300">Explorador</span>{' '}
        para que aquí aparezcan tus insights.
      </div>
    )
  }

  const topGenre = mostCommon(history.map((h) => h.main_genre))
  const topMood = mostCommon(history.map((h) => h.mood_quadrant))
  const avgPopularity = Math.round(
    history.reduce((sum, h) => sum + h.popularity, 0) / history.length,
  )

  const cards = [
    { icon: Music2, label: 'Género más consultado', value: topGenre ?? '—' },
    { icon: Palette, label: 'Mood predominante', value: topMood ?? '—' },
    { icon: Star, label: 'Popularidad promedio', value: `${avgPopularity}/100` },
    { icon: Search, label: 'Canciones exploradas', value: `${history.length}` },
  ]

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-400">
        Calculado a partir de las canciones que has consultado en esta sesión.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <c.icon className="h-6 w-6 text-violet-400" />
            <div className="mt-2 text-lg font-bold text-violet-300">{c.value}</div>
            <div className="text-xs text-zinc-500">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
