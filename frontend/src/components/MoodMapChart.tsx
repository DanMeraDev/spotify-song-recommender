import {
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { RecommendedSong, SongDetail } from '../types'

interface Props {
  query: SongDetail
  recommendations: RecommendedSong[]
}

export default function MoodMapChart({ query, recommendations }: Props) {
  const recPoints = recommendations.map((r) => ({ x: r.valence, y: r.energy, name: r.name }))
  const queryPoint = [{ x: query.valence, y: query.energy, name: query.name }]

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-2 text-sm font-medium text-zinc-300">
        Mapa de moods (modelo de Russell): valence vs. energy
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid stroke="#27272a" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 1]}
            name="Valence"
            tick={{ fill: '#a1a1aa', fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 1]}
            name="Energy"
            tick={{ fill: '#a1a1aa', fontSize: 12 }}
          />
          <ZAxis range={[90, 90]} />
          <ReferenceLine x={0.5} stroke="#3f3f46" strokeDasharray="4 4" />
          <ReferenceLine y={0.5} stroke="#3f3f46" strokeDasharray="4 4" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ background: '#18181b', border: '1px solid #3f3f46' }}
            formatter={(value) => Number(value).toFixed(2)}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Scatter name="Recomendadas" data={recPoints} fill="#22c55e" />
          <Scatter name="Tu canción" data={queryPoint} fill="#f43f5e" shape="star" />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-zinc-500">
        <div>↖ Intenso / Agresivo</div>
        <div>↗ Enérgico / Festivo</div>
        <div>↙ Melancólico</div>
        <div>↘ Relajado / Alegre</div>
      </div>
    </div>
  )
}
