import { Search } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="search" className="text-sm text-zinc-400">
        Busca por <span className="font-medium text-zinc-200">nombre de canción</span> o{' '}
        <span className="font-medium text-zinc-200">nombre de artista</span> (no necesitas
        escribirlo completo)
      </label>
      <div className="relative flex gap-2">
        <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          id="search"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ej: Blinding Lights, Coldplay, Bad Bunny..."
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 py-3 pr-4 pl-11 text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40 focus:outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  )
}
