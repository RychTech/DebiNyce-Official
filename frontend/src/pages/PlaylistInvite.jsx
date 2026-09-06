import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'

const API_BASE = '/api'

export default function PlaylistInvitePage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { playSong } = usePlayer()
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    if (!code) {
      setError('No invitation code provided')
      setLoading(false)
      return
    }

    const fetchPlaylist = async () => {
      const token = localStorage.getItem('token')
      try {
        const res = await fetch(`${API_BASE}/playlists/invite/${code}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.message || 'Playlist not found')
          setLoading(false)
          return
        }

        setPlaylist(data.playlist)
        setJoined(data.playlist.joined)
      } catch {
        setError('Failed to load playlist')
      } finally {
        setLoading(false)
      }
    }

    fetchPlaylist()
  }, [code])

  const handleJoin = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    try {
      const res = await fetch(`${API_BASE}/playlists/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()

      if (data.success) {
        setJoined(true)
      } else {
        setError(data.message || 'Failed to join playlist')
      }
    } catch {
      setError('Network error. Please try again.')
    }
  }

  const handlePlay = (song) => {
    const queue = playlist.songs.map((i) => ({ ...i.song, artist: i.song.artist }))
    playSong({ ...song, artist: song.artist }, queue)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-primary)',
        color: 'var(--text-muted)', fontFamily: 'var(--font-sans)',
      }}>
        Loading...
      </div>
    )
  }

  if (error || !playlist) {
    return (
      <div className="song-detail-error" style={{ minHeight: '100vh', paddingTop: '100px' }}>
        <div className="error-icon">🔗</div>
        <h2>Playlist Not Found</h2>
        <p>{error || 'This invitation link is invalid or the playlist has been removed.'}</p>
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    )
  }

  return (
    <div className="song-detail-page">
      <nav className="song-nav">
        <div className="song-nav-inner">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div className="song-nav-brand">
            <span className="song-nav-logo">DebiNyce</span>
          </div>
        </div>
      </nav>

      <main className="song-detail-main">
        <div className="container">
          <div className="song-hero">
            <div
              className="song-art-large"
              style={{
                background: 'var(--gradient-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
              }}
            >
              {playlist.songs.length > 0 ? (
                <div className="playlist-cover-collage" style={{ width: '100%', height: '100%' }}>
                  {playlist.songs.slice(0, 4).map((item, index) => (
                    <div
                      key={item.song.id}
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        background: item.song.albumArtUrl
                          ? `url(${item.song.albumArtUrl}) center/cover`
                          : 'var(--gradient-brand)',
                        transform: `rotate(${index * 5}deg) scale(1.05)`,
                        opacity: 0.85,
                      }}
                    >
                      {!item.song.albumArtUrl && (
                        <span style={{ fontSize: '2rem', color: 'var(--peach-300)' }}>♪</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="song-art-placeholder">
                  <span className="song-art-icon">🎶</span>
                </div>
              )}
            </div>

            <div className="song-info-hero">
              <span className="song-badge" style={{
                background: playlist.isPublic
                  ? 'rgba(34, 197, 94, 0.1)'
                  : 'rgba(251, 191, 36, 0.1)',
                color: playlist.isPublic ? '#22c55e' : '#fbbf24',
                borderColor: playlist.isPublic
                  ? 'rgba(34, 197, 94, 0.2)'
                  : 'rgba(251, 191, 36, 0.2)',
              }}>
                {playlist.isPublic ? 'Public' : 'Private'}
              </span>
              <h1 className="song-title-hero">{playlist.name}</h1>
              <p className="song-artist-hero">
                by {playlist.creator?.artistProfile || playlist.creator?.fullName || 'Unknown Creator'}
              </p>

              <div className="song-meta">
                <span>
                  <strong>{playlist.songCount}</strong> songs
                </span>
                <span>
                  <strong>Invitation Code:</strong> {playlist.invitationCode}
                </span>
              </div>

              {!joined ? (
                <button className="btn btn-primary btn-lg" onClick={handleJoin}>
                  Join Playlist
                </button>
              ) : (
                <span style={{
                  color: '#22c55e', fontSize: '0.9375rem',
                  fontWeight: 500, marginBottom: '16px',
                }}>
                  ✓ You're a member of this playlist
                </span>
              )}
            </div>
          </div>

          {/* Songs */}
          <div className="song-details-section">
            <h2 className="section-title">
              {joined ? 'Playlist Songs' : 'Songs (Join to Access)'}
            </h2>

            {joined ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {playlist.songs.map((item, index) => (
                  <div
                    key={item.song.id}
                    className="card"
                    style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
                  >
                    <div
                      style={{
                        width: '56px', height: '56px', borderRadius: 'var(--radius-md)',
                        background: item.song.albumArtUrl
                          ? `url(${item.song.albumArtUrl}) center/cover`
                          : 'var(--gradient-card)',
                        overflow: 'hidden', flexShrink: 0,
                      }}
                    >
                      {item.song.albumArtUrl ? (
                        <img src={item.song.albumArtUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.5rem', color: 'var(--peach-300)' }}>♪</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '2px' }}>
                        {item.song.title}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {item.song.artist?.artistProfile || item.song.artist?.fullName || 'Unknown'} ·{' '}
                        {item.song.duration
                          ? `${Math.floor(item.song.duration / 60)}:${String(item.song.duration % 60).padStart(2, '0')}`
                          : 'Unknown'}
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handlePlay(item.song)}
                      disabled={!item.song.audioUrl}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '4px' }}>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Play
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ textAlign: 'center' }}>
                <div className="empty-icon">🔒</div>
                <h3>This Playlist is Private</h3>
                <p>
                  Join using the invitation code above, or log in if you already have access.
                </p>
                <button className="btn btn-primary" onClick={() => {
                  const token = localStorage.getItem('token')
                  if (token) handleJoin()
                  else navigate('/login')
                }}>
                  {localStorage.getItem('token') ? 'Join Now' : 'Log In to Join'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
