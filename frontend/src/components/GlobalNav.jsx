import { useNavigate, useLocation } from 'react-router-dom'

export default function GlobalNav({ user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname.startsWith(path)

  const links = [
    { to: '/home', label: 'Home' },
    { to: '/charts', label: 'Charts' },
    { to: '/liked', label: 'Liked' },
  ]
  if (user && (user.role === 'ARTIST' || user.role === 'ADMIN')) {
    links.push({ to: '/artist-dashboard', label: 'Artist Studio' })
  }
  if (user && user.role === 'ADMIN') {
    links.push({ to: '/admin', label: 'Admin Panel' })
  }

  return (
    <nav className="global-nav">
      <div className="global-nav-inner">
        <button className="global-brand" onClick={() => navigate('/home')}>
          <span className="global-brand-mark">D</span>
          <span className="global-brand-name">DebiNyce</span>
        </button>

        <div className="global-nav-links">
          {links.map((link) => (
            <button
              key={link.to}
              className={`global-nav-link ${isActive(link.to) ? 'active' : ''}`}
              onClick={() => navigate(link.to)}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="global-nav-user">
          <span className="global-nav-name">
            {user?.username || user?.fullName || 'Listener'}
          </span>
          <button className="btn btn-secondary btn-sm mt-0" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}