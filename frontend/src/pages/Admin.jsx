import { useState, useEffect, useRef, useCallback } from 'react'
import { ActivityChart, BarChart, ArtistBarChart, LiveFeed, StatCard } from '../components/Charts'

const API_BASE = '/api'

const MENUS = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'activity', label: 'Live Activity', icon: '🟢' },
  { key: 'artists', label: 'Artist Approvals', icon: '🎤' },
  { key: 'users', label: 'Users', icon: '👥' },
  { key: 'songs', label: 'Songs', icon: '🎵' },
]

const TOP_METRICS = [
  { key: 'plays', label: 'Most Played', color: '#f8a68b' },
  { key: 'streams', label: 'Most Streamed', color: '#3b82f6' },
  { key: 'likes', label: 'Most Liked', color: '#f472b6' },
  { key: 'shares', label: 'Most Shared', color: '#34d399' },
]

export default function AdminPage({ user, onLogout }) {
  const [menu, setMenu] = useState('overview')
  const [range, setRange] = useState('7d')

  const [overview, setOverview] = useState(null)
  const [activity, setActivity] = useState([])
  const [growth, setGrowth] = useState([])
  const [topSets, setTopSets] = useState({})
  const [recentEvents, setRecentEvents] = useState([])
  const [topArtists, setTopArtists] = useState([])
  const [pendingArtists, setPendingArtists] = useState([])
  const [usersList, setUsersList] = useState([])
  const [songsList, setSongsList] = useState([])
  const [actionsLoading, setActionsLoading] = useState(false)

  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const api = useCallback(async (path, options) => {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...(options?.headers || {}), Authorization: `Bearer ${token}` },
    })
    return res.json()
  }, [])

  const fetchOverview = useCallback(async () => {
    try {
      const data = await api(`/admin/stats/overview?range=${range}`)
      if (data.success && mounted.current) setOverview(data.stats)
    } catch {}
  }, [api, range])

  const fetchActivity = useCallback(async () => {
    try {
      const data = await api(`/admin/stats/activity?range=${range}`)
      if (data.success && mounted.current) setActivity(data.series)
    } catch {}
  }, [api, range])

  const fetchGrowth = useCallback(async () => {
    try {
      const data = await api(`/admin/stats/growth?range=${range}`)
      if (data.success && mounted.current) setGrowth(data.series)
    } catch {}
  }, [api, range])

  const fetchTop = useCallback(async () => {
    try {
      const results = await Promise.all(
        TOP_METRICS.map((m) => api(`/admin/stats/top?metric=${m.key}&limit=8`))
      )
      const sets = {}
      results.forEach((data, i) => {
        if (data.success && mounted.current) sets[TOP_METRICS[i].key] = data.songs
      })
      if (mounted.current) setTopSets(sets)
    } catch {}
  }, [api])

  const fetchPendingArtists = useCallback(async () => {
    try {
      const data = await api('/artists/pending')
      if (data.success && mounted.current) setPendingArtists(data.artists)
    } catch {}
  }, [api])

  const fetchRecentEvents = useCallback(async () => {
    try {
      const data = await api('/admin/stats/recent?limit=24')
      if (data.success && mounted.current) setRecentEvents(data.events)
    } catch {}
  }, [api])

  const fetchTopArtists = useCallback(async () => {
    try {
      const data = await api('/admin/stats/topartists?limit=8')
      if (data.success && mounted.current) setTopArtists(data.artists)
    } catch {}
  }, [api])

  const fetchUsers = useCallback(async () => {
    try {
      const data = await api('/admin/users')
      if (data.success && mounted.current) setUsersList(data.users)
    } catch {}
  }, [api])

  const fetchSongs = useCallback(async () => {
    try {
      const data = await api('/admin/songs')
      if (data.success && mounted.current) setSongsList(data.songs)
    } catch {}
  }, [api])

  const poll = useCallback(() => {
    fetchOverview()
    fetchActivity()
    fetchGrowth()
    fetchTop()
    fetchPendingArtists()
    fetchRecentEvents()
    fetchTopArtists()
  }, [fetchOverview, fetchActivity, fetchGrowth, fetchTop, fetchPendingArtists, fetchRecentEvents, fetchTopArtists])

  useEffect(() => {
    poll()
    const timer = setInterval(poll, 6000)
    return () => clearInterval(timer)
  }, [poll, range])

  useEffect(() => {
    if (menu === 'users') fetchUsers()
    if (menu === 'songs') fetchSongs()
  }, [menu, fetchUsers, fetchSongs])

  const handleApprove = async (artistId) => {
    setActionsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/artists/${artistId}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      if (res.ok) fetchPendingArtists()
    } catch { alert('Failed to approve artist') } finally { setActionsLoading(false) }
  }

  const handleReject = async (artistId) => {
    setActionsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/artists/${artistId}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      if (res.ok) fetchPendingArtists()
    } catch { alert('Failed to reject artist') } finally { setActionsLoading(false) }
  }

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user permanently?')) return
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      if (res.ok) fetchUsers()
    } catch { alert('Failed to delete user') }
  }

  const handleToggleSong = async (song) => {
    try {
      await fetch(`${API_BASE}/songs/${song.id}/publish`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      setSongsList((list) =>
        list.map((s) => (s.id === song.id ? { ...s, isPublished: !s.isPublished } : s))
      )
    } catch { alert('Failed to toggle song') }
  }

  const handleDeleteSong = async (song) => {
    if (!confirm(`Delete "${song.title}" permanently?`)) return
    try {
      await fetch(`${API_BASE}/songs/${song.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      setSongsList((list) => list.filter((s) => s.id !== song.id))
    } catch { alert('Failed to delete song') }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  }

  const totalListeners = overview?.totalUsers ?? '—'
  const totalArtists = overview?.totalArtists ?? '—'
  const totalSongs = overview?.totalSongs ?? '—'

  const activityKeys = ['PLAY', 'STREAM', 'LIKE', 'SHARE']
  const totalActivity = activity.reduce((acc, s) => {
    activityKeys.forEach((k) => { acc[k] = (acc[k] || 0) + (s[k] || 0) })
    return acc
  }, {})

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark">D</span>
          <div>
            <div className="admin-brand-name">DebiNyce</div>
            <div className="admin-brand-sub">Admin Console</div>
          </div>
        </div>

        <nav className="admin-menu">
          {MENUS.map((m) => (
            <button
              key={m.key}
              className={`admin-menu-item ${menu === m.key ? 'active' : ''}`}
              onClick={() => setMenu(m.key)}
            >
              <span className="admin-menu-icon">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          <span className="admin-user">{user?.username || user?.fullName || 'Admin'}</span>
          <button className="btn btn-secondary btn-sm" onClick={onLogout}>Logout</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <h1 className="admin-title">
            {MENUS.find((m) => m.key === menu)?.label}
          </h1>
          <div className="admin-topbar-right">
            <span className="live-badge"><span className="live-dot" /> LIVE</span>
            <button className="btn btn-secondary btn-sm" onClick={poll}>Refresh</button>
          </div>
        </div>

        {/* ─── OVERVIEW ─────────────────────────────────────── */}
        {menu === 'overview' && (
          <div className="admin-overview">
            <div className="admin-stat-grid">
              <StatCard label="Listeners" value={totalListeners} icon="👤" accent="rgba(59,130,246,0.2)" />
              <StatCard label="Artists" value={totalArtists} icon="🎤" accent="rgba(248,166,139,0.2)" />
              <StatCard label="Songs" value={totalSongs} icon="🎵" accent="rgba(167,139,250,0.2)" />
              <StatCard label="Total Plays" value={overview?.totalPlays ?? '—'} icon="▶" accent="rgba(244,114,182,0.2)" />
              <StatCard label="Total Streams" value={overview?.totalStreams ?? '—'} icon="📶" accent="rgba(52,211,153,0.2)" />
              <StatCard label="Total Likes" value={overview?.totalLikes ?? '—'} icon="♥" accent="rgba(248,166,139,0.2)" />
              <StatCard label="Total Shares" value={overview?.totalShares ?? '—'} icon="↗" accent="rgba(59,130,246,0.2)" />
              <StatCard label="Published" value={overview?.publishedSongs ?? '—'} icon="✔" accent="rgba(52,211,153,0.2)" />
            </div>

            <div className="admin-charts-grid">
              <div className="admin-card chart-card">
                <div className="admin-card-head">
                  <h2>Live Activity</h2>
                  <div className="range-switch">
                    {['24h', '7d', '30d'].map((r) => (
                      <button
                        key={r}
                        className={`range-btn ${range === r ? 'active' : ''}`}
                        onClick={() => setRange(r)}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <ActivityChart series={activity} keys={activityKeys} height={240} />
              </div>

              <div className="admin-card chart-card">
                <div className="admin-card-head">
                  <h2>User Growth</h2>
                  <span className="muted-note">{range}</span>
                </div>
                <ActivityChart series={growth} keys={['users', 'artists']} height={240} />
              </div>
            </div>

            <div className="admin-summary-row">
              <div className="admin-card summary-chip">
                <span>Plays</span><strong>{totalActivity.PLAY || 0}</strong>
              </div>
              <div className="admin-card summary-chip">
                <span>Streams</span><strong>{totalActivity.STREAM || 0}</strong>
              </div>
              <div className="admin-card summary-chip">
                <span>Likes</span><strong>{totalActivity.LIKE || 0}</strong>
              </div>
              <div className="admin-card summary-chip">
                <span>Shares</span><strong>{totalActivity.SHARE || 0}</strong>
              </div>
            </div>

            <div className="admin-bottom-grid">
              <div className="admin-card chart-card">
                <div className="admin-card-head">
                  <h2>Top Artists</h2>
                  <span className="muted-note">by total plays</span>
                </div>
                <ArtistBarChart items={topArtists} />
              </div>

              <div className="admin-card chart-card">
                <div className="admin-card-head">
                  <h2>Live Feed</h2>
                  <span className="live-badge"><span className="live-dot" /> LIVE</span>
                </div>
                <LiveFeed events={recentEvents} />
              </div>
            </div>

            <div className="admin-top-grid">
              {TOP_METRICS.map((m) => (
                <div className="admin-card" key={m.key}>
                  <div className="admin-card-head">
                    <h2>{m.label}</h2>
                    <span className="muted-note">top 8</span>
                  </div>
                  <BarChart items={topSets[m.key] || []} metric={m.key} height={m.key === 'plays' ? 200 : 180} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── LIVE ACTIVITY ────────────────────────────────── */}
        {menu === 'activity' && (
          <div className="admin-overview">
            <div className="admin-charts-grid">
              <div className="admin-card chart-card">
                <div className="admin-card-head">
                  <h2>Live Activity</h2>
                  <div className="range-switch">
                    {['24h', '7d', '30d'].map((r) => (
                      <button
                        key={r}
                        className={`range-btn ${range === r ? 'active' : ''}`}
                        onClick={() => setRange(r)}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <ActivityChart series={activity} keys={activityKeys} height={280} />
              </div>
              <div className="admin-card chart-card">
                <div className="admin-card-head">
                  <h2>User Growth</h2>
                  <span className="muted-note">{range}</span>
                </div>
                <ActivityChart series={growth} keys={['users', 'artists']} height={280} />
              </div>
            </div>

            <div className="admin-card chart-card">
              <div className="admin-card-head">
                <h2>Latest Activity</h2>
                <span className="live-badge"><span className="live-dot" /> LIVE</span>
              </div>
              <div className="live-feed-large">
                <LiveFeed events={recentEvents} />
              </div>
            </div>
          </div>
        )}

        {/* ─── ARTIST APPROVALS ─────────────────────────────── */}
        {menu === 'artists' && (
          <div className="admin-section">
            {pendingArtists.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <h3>No Pending Applications</h3>
                <p>All artist applications have been reviewed.</p>
              </div>
            ) : (
              <div className="songs-table-wrapper">
                <table className="songs-table">
                  <thead>
                    <tr>
                      <th>Artist Profile</th><th>Full Name</th><th>Nationality</th>
                      <th>Phone</th><th>Email</th><th>Submitted</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingArtists.map((artist) => (
                      <tr key={artist.id}>
                        <td>
                          <div className="song-title-wrapper">
                            <div className="song-art-placeholder">
                              <span className="song-art-icon">🎤</span>
                            </div>
                            <div className="song-title-info">
                              <span className="song-title">{artist.artistProfile}</span>
                            </div>
                          </div>
                        </td>
                        <td>{artist.fullName}</td>
                        <td>{artist.nationality}</td>
                        <td>{artist.phone}</td>
                        <td>{artist.email}</td>
                        <td className="text-muted">{formatDate(artist.createdAt)}</td>
                        <td>
                          <div className="song-actions">
                            <button className="btn btn-sm btn-primary" onClick={() => handleApprove(artist.id)} disabled={actionsLoading}>
                              Approve
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleReject(artist.id)} disabled={actionsLoading}>
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── USERS ────────────────────────────────────────── */}
        {menu === 'users' && (
          <div className="admin-section">
            <div className="songs-table-wrapper">
              <table className="songs-table">
                <thead>
                  <tr>
                    <th>User</th><th>Role</th><th>Artist Status</th><th>Songs</th>
                    <th>Playlists</th><th>Joined</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="song-title-wrapper">
                          <div className="song-art-placeholder">
                            <span className="song-art-icon">{u.role === 'ADMIN' ? '🛡' : u.role === 'ARTIST' ? '🎤' : '👤'}</span>
                          </div>
                          <div className="song-title-info">
                            <span className="song-title">{u.fullName || u.email}</span>
                            <span className="song-artist">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className={`role-badge role-${u.role.toLowerCase()}`}>{u.role}</span></td>
                      <td>
                        {u.role === 'ARTIST' ? (
                          u.artistStatus === 'APPROVED' ? <span className="approve-tag">Approved</span> : <span className="approve-tag approve-tag--pending">{u.artistStatus}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>{u.songCount}</td>
                      <td>{u.playlistCount}</td>
                      <td className="text-muted">{formatDate(u.createdAt)}</td>
                      <td>
                        {u.role !== 'ADMIN' && (
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(u.id)}>
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── SONGS ────────────────────────────────────────── */}
        {menu === 'songs' && (
          <div className="admin-section">
            <div className="songs-table-wrapper">
              <table className="songs-table">
                <thead>
                  <tr>
                    <th>Song</th><th>Artist</th><th>Genre</th><th>Plays</th><th>Streams</th>
                    <th>Likes</th><th>Shares</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {songsList.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="song-title-wrapper">
                          <div className="song-art-placeholder">
                            <span className="song-art-icon">♪</span>
                          </div>
                          <div className="song-title-info">
                            <span className="song-title">{s.title}</span>
                          </div>
                        </div>
                      </td>
                      <td>{s.artist?.artistProfile || s.artist?.fullName || '—'}</td>
                      <td>{s.genre || '—'}</td>
                      <td>{s.plays}</td>
                      <td>{s.streams}</td>
                      <td>{s.likes}</td>
                      <td>{s.shares}</td>
                      <td>
                        <span className={`role-badge ${s.isPublished ? 'role-artist' : 'role-listener'}`}>
                          {s.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td>
                        <div className="song-actions">
                          <button className="btn btn-sm btn-secondary" onClick={() => handleToggleSong(s)}>
                            {s.isPublished ? 'Unpublish' : 'Publish'}
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteSong(s)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}