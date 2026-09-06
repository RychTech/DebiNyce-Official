import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayer, getRecentPlayed } from '../context/PlayerContext'
import GlobalNav from '../components/GlobalNav'
import SongCard from '../components/SongCard'

const API_BASE = '/api'

export default function HomePage({ user, onLogout }) {
  const navigate = useNavigate()
  const { playSong } = usePlayer()
  const [songs, setSongs] = useState([])
  const [trending, setTrending] = useState([])
  const [artists, setArtists] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`${API_BASE}/songs`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSongs(data.songs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch(`${API_BASE}/songs/trending?metric=plays&limit=10`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTrending(data.songs)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch(`${API_BASE}/artists`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setArtists(data.artists)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setRecent(getRecentPlayed())
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return songs
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.artist?.artistProfile || '').toLowerCase().includes(q) ||
        (s.genre || '').toLowerCase().includes(q)
    )
  }, [songs, query])

  const heroSong = trending[0] || songs[0]

  return (
    <div className="app-page">
      <GlobalNav user={user} onLogout={onLogout} />

      <main className="browse-main">
        <div className="container">
          <header className="browse-header">
            <div>
              <h1 className="browse-title">
                Good vibes,{' '}
                <span className="gradient-text">{user?.username || user?.fullName || 'listener'}</span>
              </h1>
              <p className="browse-subtitle">Browse the library and play anything.</p>
            </div>

            <div className="search-box">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="search-icon">
                <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search songs, artists, genres…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  document.querySelector('.library-scroll')?.scrollIntoView({ behavior: 'smooth' })
                }}
              />
            </div>
          </header>

          {query.trim() ? (
            loading ? (
              <div className="song-detail-loading">
                <div className="loading-spinner" />
                <p>Loading library…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎵</div>
                <h3>No songs found</h3>
                <p>Try a different search.</p>
              </div>
            ) : (
              <div className="song-grid" style={{ marginTop: '24px' }}>
                {filtered.map((song, idx) => (
                  <SongCard key={song.id} song={song} queue={filtered} index={idx} />
                ))}
              </div>
            )
          ) : (
            <>
              {heroSong && (
                <section className="hero-card">
                  <div
                    className="hero-card-bg"
                    style={
                      heroSong.backgroundUrl
                        ? { backgroundImage: `url(${heroSong.backgroundUrl})` }
                        : undefined
                    }
                  >
                    <div className="hero-card-overlay" />
                  </div>
                  <div className="hero-card-art">
                    {heroSong.albumArtUrl ? (
                      <img src={heroSong.albumArtUrl} alt={heroSong.title} />
                    ) : (
                      <span>♪</span>
                    )}
                  </div>
                  <div className="hero-card-info">
                    <span className="hero-card-tag">Trending now</span>
                    <h2 className="hero-card-title">{heroSong.title}</h2>
                    <p className="hero-card-artist">
                      {heroSong.artist?.artistProfile || heroSong.artist?.fullName || 'Unknown Artist'}
                    </p>
                    <div className="hero-card-actions">
                      <button
                        className="btn btn-primary hero-play"
                        onClick={() => playSong(heroSong, trending.length ? trending : [heroSong])}
                      >
                        ▶ Play
                      </button>
                      <button className="btn btn-secondary" onClick={() => navigate(`/songs/${heroSong.id}`)}>
                        View Song
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {recent.length > 0 && (
                <section className="browse-section">
                  <div className="section-head">
                    <h2 className="section-title">Recently Played</h2>
                    <span className="section-link" onClick={() => navigate('/liked')}>
                      Liked ♥
                    </span>
                  </div>
                  <div className="song-grid">
                    {recent.slice(0, 8).map((song, idx) => (
                      <SongCard key={song.id} song={song} queue={recent} index={idx} />
                    ))}
                  </div>
                </section>
              )}

              {trending.length > 0 && (
                <section className="browse-section">
                  <div className="section-head">
                    <h2 className="section-title">Trending Now</h2>
                    <span className="section-link" onClick={() => navigate('/charts')}>
                      Full Charts →
                    </span>
                  </div>
                  <div className="song-grid">
                    {trending.slice(0, 10).map((song, idx) => (
                      <SongCard key={song.id} song={song} queue={trending} index={idx} />
                    ))}
                  </div>
                </section>
              )}

              <section className="browse-section library-scroll">
                <div className="section-head">
                  <h2 className="section-title">All Tracks</h2>
                  <span className="section-link" onClick={() => navigate('/charts')}>
                    Charts →
                  </span>
                </div>
                {loading ? (
                  <div className="song-detail-loading">
                    <div className="loading-spinner" />
                  </div>
                ) : songs.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🎵</div>
                    <h3>No songs yet</h3>
                    <p>Songs published by artists will appear here.</p>
                  </div>
                ) : (
                  <div className="song-grid">
                    {songs.slice(0, 18).map((song, idx) => (
                      <SongCard key={song.id} song={song} queue={songs} index={idx} />
                    ))}
                  </div>
                )}
              </section>

              <section className="browse-section artist-rail">
                <div className="section-head">
                  <h2 className="section-title">Artists</h2>
                </div>
                {artists && artists.length > 0 && (
                  <div className="artist-pills">
                    {artists.slice(0, 12).map((a) => (
                      <button className="artist-pill" key={a.id} onClick={() => navigate(`/artists/${a.id}`)}>
                        {a.photo ? <img src={a.photo} alt="" /> : <span className="artist-pill-ph">♪</span>}
                        <span>{a.artistProfile}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  )
}