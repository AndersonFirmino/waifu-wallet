import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../hooks/useTheme'
import { useLocale } from '../hooks/useLocale'

interface NavItem {
  path: string
  icon: string
  labelKey: string
}

interface NavGroup {
  groupKey: string
  items: NavItem[]
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const NAV: NavGroup[] = [
  {
    groupKey: 'sidebar.main',
    items: [
      { path: '/', icon: '📊', labelKey: 'sidebar.dashboard' },
      { path: '/gacha', icon: '🎲', labelKey: 'sidebar.gacha' },
      { path: '/transactions', icon: '💰', labelKey: 'sidebar.transactions' },
    ],
  },
  {
    groupKey: 'sidebar.financial',
    items: [
      { path: '/salary', icon: '💼', labelKey: 'sidebar.salary_plan' },
      { path: '/savings', icon: '🐷', labelKey: 'sidebar.savings' },
      { path: '/fixed-expenses', icon: '📋', labelKey: 'sidebar.fixed_expenses' },
      { path: '/debts', icon: '🔴', labelKey: 'sidebar.debts' },
      { path: '/credit-cards', icon: '🃏', labelKey: 'sidebar.credit_cards' },
      { path: '/calendar', icon: '📅', labelKey: 'sidebar.calendar' },
    ],
  },
  {
    groupKey: 'sidebar.extras',
    items: [
      { path: '/forecast', icon: '🔮', labelKey: 'sidebar.forecast' },
      { path: '/notes', icon: '📝', labelKey: 'sidebar.notes' },
      { path: '/settings', icon: '⚙️', labelKey: 'sidebar.settings' },
    ],
  },
]

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { theme, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const { language } = useLocale()
  const isDark = theme === 'dark'

  const currentDate = new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' }).format(new Date())

  return (
    <aside
      style={{
        width: collapsed ? 64 : 240,
        minWidth: collapsed ? 64 : 240,
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        overflow: 'hidden',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 64,
          padding: collapsed ? '0' : '0 20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>💵</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text)', margin: 0 }}>Waifu Wallet</p>
              <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0 }}>beta</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? t('sidebar.expand_menu') : t('sidebar.collapse_menu')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-muted)',
            fontSize: collapsed ? 18 : 13,
            width: collapsed ? 64 : 28,
            height: collapsed ? 64 : 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: collapsed ? 0 : 6,
            flexShrink: 0,
          }}
        >
          {collapsed ? '💵' : '◀'}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        {NAV.map((group) => (
          <div key={group.groupKey} style={{ marginBottom: 4 }}>
            {!collapsed && (
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.09em',
                  color: 'var(--color-muted)',
                  padding: '6px 20px 6px',
                  margin: 0,
                }}
              >
                {t(group.groupKey)}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: collapsed ? 0 : 12,
                  padding: collapsed ? '11px 0' : '10px 20px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  textDecoration: 'none',
                  boxShadow: isActive ? 'inset 3px 0 0 var(--color-blue)' : 'none',
                  backgroundColor: isActive ? 'rgba(59,130,246,0.09)' : 'transparent',
                  color: isActive ? 'var(--color-text)' : 'var(--color-muted)',
                  fontSize: 14,
                  fontWeight: isActive ? 500 : 400,
                  transition: 'background 0.15s, color 0.15s',
                })}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{t(item.labelKey)}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={toggleTheme}
          title={isDark ? t('sidebar.light_mode') : t('sidebar.dark_mode')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? 'center' : 'flex-start',
            width: '100%',
            padding: collapsed ? '12px 0' : '12px 20px',
            fontSize: 14,
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>{isDark ? '☀️' : '🌙'}</span>
          {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{isDark ? t('sidebar.light_mode') : t('sidebar.dark_mode')}</span>}
        </button>
        {!collapsed && (
          <div
            style={{
              padding: '0 20px 14px',
              fontSize: 11,
              color: 'var(--color-muted)',
            }}
          >
            <p style={{ margin: 0 }}>Waifu Wallet beta</p>
            <p style={{ margin: 0, opacity: 0.6 }}>{currentDate}</p>
          </div>
        )}
      </div>
    </aside>
  )
}
