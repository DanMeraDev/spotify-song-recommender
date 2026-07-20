import type { SongSummary } from '../types'

interface Props {
  songs: SongSummary[]
  selectedId?: string
  onSelect: (song: SongSummary) => void
  loading?: boolean
}

export default function SongList({ songs, selectedId, onSelect, loading }: Props) {
  if (loading) {
    return <div className="py-10 text-center text-sm text-zinc-400">Cargando canciones...</div>
  }
  if (songs.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-zinc-400">
        No se encontraron canciones. Prueba con otro término de búsqueda.
      </div>
    )
  }

  return (
    <div className="max-h-[420px] overflow-y-auto rounded-xl border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 z-10 bg-zinc-900 text-xs tracking-wide text-zinc-500 uppercase">
          <tr>
            <th className="px-4 py-3 font-medium">Canción</th>
            <th className="px-4 py-3 font-medium">Artista</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">Género</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">Mood</th>
            <th className="px-4 py-3 text-right font-medium">Popularidad</th>
          </tr>
        </thead>
        <tbody>
          {songs.map((song) => {
            const selected = song.id === selectedId
            return (
              <tr
                key={song.id}
                onClick={() => onSelect(song)}
                title="Haz clic para ver sus recomendaciones"
                className={`cursor-pointer border-t border-zinc-800/70 transition-colors ${
                  selected ? 'bg-violet-500/15' : 'hover:bg-zinc-800/50'
                }`}
              >
                <td className="px-4 py-3 font-medium text-zinc-100">{song.name}</td>
                <td className="px-4 py-3 text-zinc-400">{song.artists}</td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300">
                    {song.main_genre}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-zinc-400 md:table-cell">{song.mood_quadrant}</td>
                <td className="px-4 py-3 text-right text-zinc-400 tabular-nums">{song.popularity}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
