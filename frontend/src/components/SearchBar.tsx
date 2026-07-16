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
      <div className="flex gap-2">
        <input
          id="search"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ej: Blinding Lights, Coldplay, Bad Bunny..."
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="rounded-lg border border-zinc-700 px-4 py-2.5 text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  )
}
