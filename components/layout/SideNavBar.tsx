'use client'

// ---------------------------------------------------------------------------
// SideNavBar — left navigation rail.
// Phase 1: static links, "Projects" always active. Non-board routes are
// visual stubs only. The active pill uses surface-container-lowest (white in
// light mode) on a surface-container-low background — no borders needed.
// ---------------------------------------------------------------------------

interface NavItem {
  label: string
  icon: React.ReactNode
  active?: boolean
}

export function SideNavBar() {
  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col bg-surface-container-low px-3 py-4">
      {/* Workspace identity */}
      <div className="mb-4 flex items-center gap-3 px-2 py-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
          <ProjectIcon className="text-on-primary" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-on-surface">Engineering</p>
          <p className="truncate text-xs text-on-surface-variant">Product Team</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-0.5">
        <NavLink icon={<DashboardIcon />} label="Dashboard" />
        <NavLink icon={<TasksIcon />}     label="My Tasks" />
        <NavLink icon={<ProjectIcon />}   label="Projects" active />
        <NavLink icon={<TeamIcon />}      label="Team" />
        <NavLink icon={<AnalyticsIcon />} label="Analytics" />
      </nav>

      {/* Bottom section */}
      <div className="mt-auto flex flex-col gap-2 border-t border-outline-variant/10 pt-4">
        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-primary to-primary-dim py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90">
          <PlusIcon />
          New Project
        </button>
        <NavLink icon={<SettingsIcon />} label="Settings" />
      </div>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// NavLink — single item with active-pill style
// ---------------------------------------------------------------------------

function NavLink({ icon, label, active }: NavItem) {
  return (
    <a
      href="#"
      onClick={e => e.preventDefault()}
      className={[
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-surface-container-lowest text-primary shadow-sm'
          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
      ].join(' ')}
    >
      <span className={active ? 'text-primary' : 'text-on-surface-variant'}>{icon}</span>
      {label}
    </a>
  )
}

// ---------------------------------------------------------------------------
// Inline icons
// ---------------------------------------------------------------------------

const DashboardIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
const TasksIcon      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
const TeamIcon       = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const AnalyticsIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
const SettingsIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
const PlusIcon       = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>

function ProjectIcon({ className }: { className?: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="8" height="8" x="2" y="2" rx="1"/><path d="M2 13h8M2 17h8M13 2h8M13 7h8M13 12h4"/><path d="m16 17 2 2 4-4"/></svg>
}
