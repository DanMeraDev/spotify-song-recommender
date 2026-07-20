import { HelpCircle } from 'lucide-react'

/** Ícono de ayuda con un tooltip explicativo al pasar el mouse. */
export default function InfoHint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <HelpCircle className="h-4 w-4 cursor-help text-zinc-500 hover:text-zinc-300" />
      <span className="pointer-events-none absolute top-full left-1/2 z-30 mt-1.5 hidden w-60 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-800 p-2.5 text-xs leading-snug font-normal text-zinc-200 shadow-xl group-hover:block">
        {text}
      </span>
    </span>
  )
}
