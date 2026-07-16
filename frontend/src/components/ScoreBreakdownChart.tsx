import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { RecommendedSong } from '../types'

const WEIGHTS = { audio: 0.45, mood: 0.25, genre: 0.2, pop: 0.1 }

export default function ScoreBreakdownChart({ items }: { items: RecommendedSong[] }) {
  const data = items.map((song) => ({
    name: song.name.length > 18 ? `${song.name.slice(0, 18)}…` : song.name,
    Audio: Number((song.sim_audio * WEIGHTS.audio).toFixed(3)),
    Mood: Number((song.sim_mood * WEIGHTS.mood).toFixed(3)),
    Género: Number((song.sim_genre * WEIGHTS.genre).toFixed(3)),
    Popularidad: Number((song.sim_pop * WEIGHTS.pop).toFixed(3)),
  }))

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-2 text-sm font-medium text-zinc-300">
        ¿Por qué se recomendó? Aporte de cada factor al score
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid stroke="#27272a" horizontal={false} />
          <XAxis type="number" domain={[0, 1]} tick={{ fill: '#a1a1aa', fontSize: 12 }} />
          <YAxis type="category" dataKey="name" width={140} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Audio" stackId="s" fill="#22c55e" />
          <Bar dataKey="Mood" stackId="s" fill="#3b82f6" />
          <Bar dataKey="Género" stackId="s" fill="#f59e0b" />
          <Bar dataKey="Popularidad" stackId="s" fill="#a855f7" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
