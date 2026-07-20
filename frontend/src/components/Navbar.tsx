import {
  Bell,
  Flame,
  Globe,
  Headphones,
  HelpCircle,
  Info,
  LogOut,
  Moon,
  Settings,
  Sparkles,
  Target,
  User,
} from 'lucide-react'
import { useState } from 'react'

export type TabId = 'explorer' | 'history' | 'insights' | 'community'

const TABS: { id: TabId; label: string }[] = [
  { id: 'explorer', label: 'Explorador' },
  { id: 'history', label: 'Historial' },
  { id: 'insights', label: 'Insights' },
  { id: 'community', label: 'Comunidad' },
]

interface Props {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  /** Artista de la canción seleccionada, si hay una, para personalizar la primera notificación. */
  selectedArtist?: string
}

type Menu = 'notifications' | 'settings' | 'profile' | null

export default function Navbar({ activeTab, onTabChange, selectedArtist }: Props) {
  const [openMenu, setOpenMenu] = useState<Menu>(null)

  const notifications = [
    {
      icon: Target,
      text: selectedArtist
        ? `${selectedArtist} coincide con tus gustos`
        : 'Explora una canción para recibir coincidencias',
    },
    { icon: Flame, text: '3 canciones nuevas de tu género favorito esta semana' },
    { icon: Sparkles, text: 'Tu Top 5 de hoy tiene un 98% de afinidad promedio' },
  ]

  const settingsOptions = [
    { icon: Moon, text: 'Tema: Oscuro' },
    { icon: Globe, text: 'Idioma: Español' },
    { icon: Info, text: 'Acerca de SoundMatch' },
  ]

  const profileOptions = [
    { icon: User, text: 'Perfil' },
    { icon: HelpCircle, text: 'Ayuda' },
    { icon: LogOut, text: 'Cerrar sesión' },
  ]

  function toggle(menu: Menu) {
    setOpenMenu((prev) => (prev === menu ? null : menu))
  }

  return (
    <header className="relative flex items-center justify-between border-b border-zinc-800/80 px-6 py-3">
      {/* Tabs (igual a la referencia: Explorer / History / Insights / Community) */}
      <nav className="flex items-center gap-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              onTabChange(tab.id)
              setOpenMenu(null)
            }}
            className={`border-b-2 pb-1 text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-violet-500 font-semibold text-violet-300'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Iconos con dropdowns funcionales */}
      <div className="flex items-center gap-4 text-zinc-400">
        <div className="relative">
          <button
            type="button"
            onClick={() => toggle('notifications')}
            aria-label="Notificaciones"
            className="relative transition-colors hover:text-zinc-100"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-fuchsia-500" />
          </button>
          {openMenu === 'notifications' && (
            <div className="absolute top-full right-0 z-50 mt-2 w-72 rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-xl">
              <div className="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                Notificaciones
              </div>
              <ul className="flex flex-col gap-2">
                {notifications.map((n) => (
                  <li
                    key={n.text}
                    className="flex items-start gap-2 rounded-lg bg-zinc-800/60 px-2.5 py-2 text-xs text-zinc-200"
                  >
                    <n.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
                    {n.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggle('settings')}
            aria-label="Configuración"
            className="transition-colors hover:text-zinc-100"
          >
            <Settings className="h-5 w-5" />
          </button>
          {openMenu === 'settings' && (
            <div className="absolute top-full right-0 z-50 mt-2 w-56 rounded-xl border border-zinc-700 bg-zinc-900 p-2 shadow-xl">
              <div className="px-2 py-1.5 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                Configuración
              </div>
              {settingsOptions.map((opt) => (
                <button
                  key={opt.text}
                  type="button"
                  onClick={() => setOpenMenu(null)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                >
                  <opt.icon className="h-4 w-4 text-zinc-400" />
                  {opt.text}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggle('profile')}
            aria-label="Perfil"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600"
          >
            <Headphones className="h-4 w-4 text-white" />
          </button>
          {openMenu === 'profile' && (
            <div className="absolute top-full right-0 z-50 mt-2 w-52 rounded-xl border border-zinc-700 bg-zinc-900 p-2 shadow-xl">
              <div className="px-2.5 py-1.5 text-xs text-zinc-400">Sesión de invitado</div>
              {profileOptions.map((opt) => (
                <button
                  key={opt.text}
                  type="button"
                  onClick={() => setOpenMenu(null)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                >
                  <opt.icon className="h-4 w-4 text-zinc-400" />
                  {opt.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {openMenu && (
        <button
          aria-label="Cerrar menú"
          onClick={() => setOpenMenu(null)}
          className="fixed inset-0 z-40 cursor-default"
        />
      )}
    </header>
  )
}
