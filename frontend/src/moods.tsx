import { CloudRain, Flame, Leaf, type LucideIcon, Music2, PartyPopper } from 'lucide-react'

/** Metadatos de los 4 cuadrantes emocionales del modelo de Russell (para el mapa de moods). */
export interface Quadrant {
  /** Valor exacto de mood_quadrant que llega del backend. */
  key: string
  title: string
  icon: LucideIcon
  color: string
  desc: string
  corner: 'tl' | 'tr' | 'bl' | 'br'
}

export const QUADRANTS: Quadrant[] = [
  { key: 'Intenso / Agresivo', title: 'INTENSO', icon: Flame, color: 'text-rose-300', desc: 'Euforia, Rock', corner: 'tl' },
  { key: 'Enérgico / Festivo', title: 'FIESTA', icon: PartyPopper, color: 'text-amber-300', desc: 'Baile, Pop', corner: 'tr' },
  { key: 'Melancólico', title: 'MELANCÓLICO', icon: CloudRain, color: 'text-indigo-300', desc: 'Tristeza, Acústico', corner: 'bl' },
  { key: 'Relajado / Alegre', title: 'RELAX', icon: Leaf, color: 'text-emerald-300', desc: 'Chill, Jazz', corner: 'br' },
]

/** Ícono representativo de un cuadrante de mood (con fallback genérico). */
export function MoodIcon({ quadrant, className }: { quadrant: string; className?: string }) {
  const Icon = QUADRANTS.find((q) => q.key === quadrant)?.icon ?? Music2
  return <Icon className={className} />
}
