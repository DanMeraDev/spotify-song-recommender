import type { RecommendedSong } from '../types'
import { spotifySearchUrl, youtubeSearchUrl } from '../utils'

export default function Recommendations({ items }: { items: RecommendedSong[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((song, i) => (
        <div key={song.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-1 text-xs text-zinc-500">#{i + 1}</div>
          <div className="truncate font-medium text-zinc-100" title={song.name}>
            {song.name}
          </div>
          <div className="truncate text-sm text-zinc-400" title={song.artists}>
            {song.artists}
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            {song.main_genre} · {song.mood_quadrant}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-green-500"
                style={{ width: `${Math.round(song.score * 100)}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-green-400">
              {(song.score * 100).toFixed(1)}%
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <a
              href={youtubeSearchUrl(song.name, song.artists)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400"
            >
              ▶ YouTube
            </a>
            <a
              href={spotifySearchUrl(song.name, song.artists)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-green-400"
            >
              ● Spotify
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
