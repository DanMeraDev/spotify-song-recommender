import { BarChart3, Compass, Headphones, Library, TrendingUp } from 'lucide-react'

export type SectionId = 'catalogo' | 'analisis' | 'top5'

const NAV: { icon: typeof Compass; label: string; section: SectionId }[] = [
  { icon: Compass, label: 'Explorador', section: 'catalogo' },
  { icon: BarChart3, label: 'Análisis', section: 'analisis' },
  { icon: Library, label: 'Biblioteca', section: 'catalogo' },
  { icon: TrendingUp, label: 'Tendencias', section: 'top5' },
]

interface Props {
  total: number
  activeSection: SectionId | null
  onNavigate: (section: SectionId) => void
}

export default function Sidebar({ total, activeSection, onNavigate }: Props) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950 p-4 lg:flex">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600">
          <Headphones className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-zinc-50">SoundMatch</div>
          <div className="text-[10px] tracking-wider text-violet-400/80">RECOMENDADOR BI</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onNavigate(item.section)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
              activeSection === item.section
                ? 'bg-violet-500/15 font-medium text-violet-300'
                : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
        <div className="text-xs font-medium text-zinc-300">Catálogo cargado</div>
        <div className="mt-1 text-2xl font-bold text-violet-400">
          {total.toLocaleString('es')}
        </div>
        <div className="text-[11px] text-zinc-500">canciones analizadas</div>
      </div>
    </aside>
  )
}
