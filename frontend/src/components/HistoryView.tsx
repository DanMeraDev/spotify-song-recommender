import type { HistoryEntry } from '../types'
import { timeAgo } from '../utils'

interface Props {
  history: HistoryEntry[]
  onSelect: (entry: HistoryEntry) => void
  onClear: () => void
}

export default function HistoryView({ history, onSelect, onClear }: Props) {
  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-400">
        Todavía no has consultado ninguna canción. Ve a{' '}
        <span className="font-medium text-violet-300">Explorador</span> y elige una para
        empezar tu historial.
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          Canciones que has consultado en este navegador ({history.length}).
        </p>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-zinc-500 hover:text-red-400"
        >
          Borrar historial
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {history.map((entry) => (
          <button
            key={`${entry.id}-${entry.ts}`}
            type="button"
            onClick={() => onSelect(entry)}
            className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-left transition-colors hover:border-violet-500/50 hover:bg-zinc-800/60"
          >
            <div className="min-w-0">
              <div className="truncate font-medium text-zinc-100">{entry.name}</div>
              <div className="truncate text-sm text-zinc-400">{entry.artists}</div>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs text-zinc-500">
              <span className="hidden rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300 sm:inline">
                {entry.main_genre}
              </span>
              <span>{timeAgo(entry.ts)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
