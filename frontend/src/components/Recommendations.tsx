import { Disc3, PlayCircle } from 'lucide-react'
import type { RecommendedSong } from '../types'
import { spotifySearchUrl, youtubeSearchUrl } from '../utils'

export default function Recommendations({ items }: { items: RecommendedSong[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((song, i) => {
        const match = Math.round(song.score * 100)
        return (
          <div
            key={song.id}
            className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-violet-500/50"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-300">
                {i + 1}
              </span>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                {song.main_genre}
              </span>
            </div>

            <div className="truncate font-semibold text-zinc-100" title={song.name}>
              {song.name}
            </div>
            <div className="truncate text-sm text-zinc-400" title={song.artists}>
              {song.artists}
            </div>
            <div className="mt-1 text-xs text-zinc-500">{song.mood_quadrant}</div>

            <div className="mt-3">
              <div className="text-lg font-bold text-violet-400">{match}%</div>
              <div className="text-[11px] text-zinc-500">de coincidencia contigo</div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                  style={{ width: `${match}%` }}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 border-t border-zinc-800 pt-3">
              <a
                href={youtubeSearchUrl(song.name, song.artists)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400"
              >
                <PlayCircle className="h-3.5 w-3.5" /> YouTube
              </a>
              <a
                href={spotifySearchUrl(song.name, song.artists)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-emerald-400"
              >
                <Disc3 className="h-3.5 w-3.5" /> Spotify
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}
