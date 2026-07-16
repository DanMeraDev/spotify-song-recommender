import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { RecommendedSong, SongDetail } from '../types'

interface Props {
  query: SongDetail
  recommendations: RecommendedSong[]
}

const FEATURES: { key: keyof SongDetail; label: string }[] = [
  { key: 'danceability_n', label: 'Danceability' },
  { key: 'energy_n', label: 'Energy' },
  { key: 'loudness_n', label: 'Loudness' },
  { key: 'speechiness_n', label: 'Speechiness' },
  { key: 'valence', label: 'Valence' },
]

export default function AudioRadarChart({ query, recommendations }: Props) {
  const data = FEATURES.map(({ key, label }) => {
    const recsAvg =
      recommendations.reduce((sum, r) => sum + (r[key] as number), 0) / recommendations.length
    return {
      feature: label,
      'Tu canción': Number((query[key] as number).toFixed(3)),
      Recomendadas: Number(recsAvg.toFixed(3)),
    }
  })

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-2 text-sm font-medium text-zinc-300">
        Perfil de audio: tu canción vs. recomendadas (promedio)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} outerRadius={100}>
          <PolarGrid stroke="#3f3f46" />
          <PolarAngleAxis dataKey="feature" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
          <Radar name="Tu canción" dataKey="Tu canción" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.25} />
          <Radar name="Recomendadas" dataKey="Recomendadas" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
