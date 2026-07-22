import { Music2, Palette, Star, Tag, X, Zap } from 'lucide-react'

const FACTORS = [
  { icon: Music2, label: 'Sonido (audio)', pct: '45%' },
  { icon: Palette, label: 'Estado de ánimo (mood)', pct: '25%' },
  { icon: Tag, label: 'Género', pct: '20%' },
  { icon: Star, label: 'Popularidad del artista', pct: '10%' },
]

export default function AlgorithmInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold text-zinc-50">
            <Zap className="h-5 w-5 text-violet-400" />
            ¿Cómo funciona el algoritmo?
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-zinc-500 transition-colors hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-zinc-400">
          Comparamos tu canción con el resto del catálogo combinando 4 factores, cada uno con
          un peso distinto en el resultado final:
        </p>

        <div className="mb-4 flex flex-col gap-2">
          {FACTORS.map((f) => (
            <div
              key={f.label}
              className="flex items-center justify-between rounded-lg bg-zinc-800/60 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 text-zinc-200">
                <f.icon className="h-4 w-4 text-violet-400" />
                {f.label}
              </span>
              <span className="font-semibold text-violet-300">{f.pct}</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-xs text-zinc-500">
          Score = 0.45·Audio + 0.25·Mood + 0.20·Género + 0.10·Popularidad
        </div>
      </div>
    </div>
  )
}
