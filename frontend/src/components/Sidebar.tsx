import { NavLink } from 'react-router-dom'

interface NavItem {
  path: string
  icon: string
  label: string
}

interface NavGroup {
  group: string
  items: NavItem[]
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const NAV: NavGroup[] = [
  {
    group: 'Principal',
    items: [
      { path: '/', icon: '📊', label: 'Dashboard' },
      { path: '/transactions', icon: '💰', label: 'Transações' },
    ],
  },
  {
    group: 'Financeiro',
    items: [
      { path: '/fixed-expenses', icon: '📋', label: 'Gastos Fixos' },
      { path: '/debts', icon: '🔴', label: 'Dívidas' },
      { path: '/credit-cards', icon: '🃏', label: 'Cartões' },
      { path: '/calendar', icon: '📅', label: 'Calendário' },
    ],
  },
  {
    group: 'Extras',
    items: [
      { path: '/forecast', icon: '🔮', label: 'Previsão' },
      { path: '/gacha', icon: '🎲', label: 'Gacha' },
      { path: '/notes', icon: '📝', label: 'Notas' },
    ],
  },
]

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
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
              <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text)', margin: 0 }}>
                MeuCaixa
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0 }}>v2.0</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expandir menu' : 'Colapsar menu'}
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
          <div key={group.group} style={{ marginBottom: 4 }}>
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
                {group.group}
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
                {!collapsed && (
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{item.label}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--color-border)',
            fontSize: 11,
            color: 'var(--color-muted)',
          }}
        >
          <p style={{ margin: 0 }}>MeuCaixa v2.0</p>
          <p style={{ margin: 0, opacity: 0.6 }}>Março 2026</p>
        </div>
      )}
    </aside>
  )
}
