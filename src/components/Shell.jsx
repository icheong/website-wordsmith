import { useAuth } from '../context/AuthContext'
import { useStudio } from '../context/StudioContext'
import PromptLibrary from '../pages/PromptLibrary'
import WorkshopPage from '../pages/WorkshopPage'
import WorkspacePage from '../pages/WorkspacePage'
import ReviewsPage from '../pages/ReviewsPage'

const TABS = [
  { id: 'prompts', label: 'Prompts' },
  { id: 'workshop', label: 'Sentence Workshop' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'reviews', label: 'Reviews', parentOnly: true },
]

/** Single app shell: persistent top bar + tabbed content, no page reloads. */
export default function Shell() {
  const { profile, isParent, signOut } = useAuth()
  const { tab, setTab, list } = useStudio()

  const tabs = TABS.filter((t) => !t.parentOnly || isParent)
  const submittedCount = list.filter((s) => s.status === 'submitted').length

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[110rem] items-center gap-6 px-5">
          {/* Wordmark */}
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-md bg-accent font-serif text-[15px] italic text-paper">
              W
            </span>
            <span className="font-serif text-[17px] tracking-tight">
              WordSmith Studio
            </span>
          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-1" aria-label="Sections">
            {tabs.map((t) => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`relative rounded-md px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? 'text-ink'
                      : 'text-ink-soft hover:bg-paper-deep hover:text-ink'
                  }`}
                >
                  {t.label}
                  {t.id === 'reviews' && submittedCount > 0 && (
                    <span className="ml-1.5 inline-block rounded-full bg-accent px-1.5 py-px text-[10px] font-semibold text-white">
                      {submittedCount}
                    </span>
                  )}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-accent" />
                  )}
                </button>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-sm font-medium">
                {profile?.display_name ?? 'Writer'}
              </div>
              <div className="eyebrow">
                {isParent ? 'Parent' : 'Student'}
              </div>
            </div>
            <button type="button" onClick={signOut} className="btn btn-ghost">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {tab === 'prompts' && <PromptLibrary />}
        {tab === 'workshop' && <WorkshopPage />}
        {tab === 'workspace' && <WorkspacePage />}
        {tab === 'reviews' && isParent && <ReviewsPage />}
      </main>
    </div>
  )
}
