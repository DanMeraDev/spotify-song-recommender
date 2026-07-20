import { Construction } from 'lucide-react'

const MOCK_ACTIVITY = [
  { user: 'Ana', action: 'descubrió "Blinding Lights" gracias a una recomendación', time: 'hace 2 h' },
  { user: 'Luis', action: 'alcanzó un match de 99% con su canción base', time: 'hace 5 h' },
  { user: 'Marce', action: 'activó el modo descubrimiento y encontró una banda nueva', time: 'hace 1 d' },
]

export default function CommunityView() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
        <Construction className="h-4 w-4 text-amber-400" /> Próximamente
      </div>
      <p className="mb-5 text-sm text-zinc-400">
        La sección de comunidad (compartir playlists, comparar gustos con otros usuarios) está en
        construcción. Así se verá la actividad de otros usuarios:
      </p>
      <div className="flex flex-col gap-2">
        {MOCK_ACTIVITY.map((a) => (
          <div key={a.user + a.time} className="flex items-center gap-3 rounded-lg bg-zinc-800/50 px-3 py-2.5 text-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs font-bold">
              {a.user[0]}
            </span>
            <span className="text-zinc-300">
              <span className="font-medium text-zinc-100">{a.user}</span> {a.action}
            </span>
            <span className="ml-auto shrink-0 text-xs text-zinc-500">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
