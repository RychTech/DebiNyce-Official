import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePlayer, isLikedLocal, toggleLikedLocal, subscribeLiked } from '../context/PlayerContext'
import GlobalNav from '../components/GlobalNav'

const API_BASE = '/api'

export default function SongDetailPage({ user, onLogout }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [song, setSong] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [liked, setLiked] = useState(false)
  const { playSong } = usePlayer()

  useEffect(() => {
    if (song) setLiked(isLikedLocal(song.id))
  }, [song])

  useEffect(() => {
    if (!song) return
    return subscribeLiked(() => setLiked(isLikedLocal(song.id)))
  }, [song])

  useEffect(() => {
    const fetchSong = async () => {
      const token = localStorage.getItem('token')
      setLoading(true)

      try {
        const res = await fetch(`${API_BASE}/songs/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.message || 'Song not found')
          setLoading(false)
          return
        }

        setSong(data.song)
      } catch {
        setError('Failed to load song')
      } finally {
        setLoading(false)
      }
    }

    fetchSong()
  }, [id])

  const handlePlay = () => playSong(song)

  const handleLike = async () => {
    if (!song) return
    const nowLiked = toggleLikedLocal(song)
    setLiked(nowLiked)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_BASE}/songs/${song.id}/${nowLiked ? 'like' : 'unlike'}`, {
        method: nowLiked ? 'POST' : 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) setSong({ ...song, likes: data.likes })
    } catch {
      toggleLikedLocal(song, false)
    }
  }

  const handleShare = async () => {
    if (!song) return
    const token = localStorage.getItem('token')
    fetch(`${API_BASE}/songs/${song.id}/share`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => {})
    setSong({ ...song, shares: (song.shares || 0) + 1 })
    const link = `${window.location.origin}/songs/${song.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: song.title, url: link })
      } else {
        await navigator.clipboard.writeText(link)
        alert('Song link copied to clipboard')
      }
    } catch {}
  }

  if (loading) {
    return (
      <div className="song-detail-loading">
        <div className="loading-spinner" />
        <p>Loading song...</p>
      </div>
    )
  }

  if (error || !song) {
    return (
      <div className="song-detail-error">
        <div className="error-icon">🎵</div>
        <h2>Song Not Found</h2>
        <p>{error || 'This song does not exist or has been removed.'}</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className="song-detail-page">
      <GlobalNav user={user} onLogout={onLogout} />

      <main className="song-detail-main" style={{ paddingTop: '40px' }}>
        <div className="container">
          {/* Hero section */}
          <div className="song-hero">
            <div className="song-art-large">
              {song.albumArtUrl ? (
                <img src={song.albumArtUrl} alt={song.title} />
              ) : (
                <div className="song-art-placeholder">
                  <span className="song-art-icon">♪</span>
                </div>
              )}
            </div>

            <div className="song-info-hero">
              <span className="song-badge">
                {song.isPublished ? 'Published' : 'Pending Review'}
              </span>
              <h1 className="song-title-hero">{song.title}</h1>
              <p
                className="song-artist-hero"
                onClick={() => song.artist?.id && navigate(`/artists/${song.artist.id}`)}
                style={song.artist?.id ? { cursor: 'pointer' } : undefined}
              >
                by {song.artist?.artistProfile || song.artist?.fullName || 'Unknown Artist'}
              </p>

              <div className="song-meta">
                <span>
                  <strong>Duration:</strong>{' '}
                  {song.duration
                    ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, '0')}`
                    : 'Unknown'}
                </span>
                {song.genre && <span><strong>Genre:</strong> {song.genre}</span>}
              </div>

              <div className="song-hero-actions">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handlePlay}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ marginRight: '8px' }}>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play Now
                </button>

                <button className={`btn btn-ghost btn-lg ${liked ? 'liked' : ''}`} onClick={handleLike}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ marginRight: '6px' }}>
                    <path d="M12 21s-6.5-4.35-9.33-8.11C.7 9.9 1.85 6.5 5.1 6.5c1.9 0 3.1 1.1 3.9 2.15.8-1.05 2-2.15 3.9-2.15 3.25 0 4.4 3.4 2.43 6.39C18.5 16.65 12 21 12 21z" />
                  </svg>
                  {song.likes || 0} {liked ? 'Liked' : 'Likes'}
                </button>

                <button className="btn btn-ghost btn-lg" onClick={handleShare}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ marginRight: '6px' }}>
                    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
                  </svg>
                  {song.shares || 0} Shares
                </button>
              </div>

              <div className="song-stats-row">
                <span className="chip-stats">▶ {song.plays || 0} plays</span>
                <span className="chip-stats">📶 {song.streams || 0} streams</span>
              </div>
            </div>
          </div>

          {/* Song details section */}
          <div className="song-details-section">
            <h2 className="section-title">About This Track</h2>

            <div className="song-details-grid">
              <div className="detail-card">
                <div className="detail-icon">🎨</div>
                <div className="detail-content">
                  <h3 className="detail-title">Album Art</h3>
                  {song.albumArtUrl ? (
                    <img src={song.albumArtUrl} alt="Album art" className="detail-image" />
                  ) : (
                    <p className="detail-empty">No album art uploaded</p>
                  )}
                </div>
              </div>

              {song.backgroundUrl && (
                <div className="detail-card">
                  <div className="detail-icon">🖼️</div>
                  <div className="detail-content">
                    <h3 className="detail-title">Custom Background</h3>
                    <img src={song.backgroundUrl} alt="Background" className="detail-image" />
                  </div>
                </div>
              )}

              <div className="detail-card">
                <div className="detail-icon">🎤</div>
                <div className="detail-content">
                  <h3 className="detail-title">Artist</h3>
                  <div className="artist-profile-mini">
                    {song.artist?.photo ? (
                      <img src={song.artist.photo} alt="Artist" className="artist-avatar-mini" />
                    ) : (
                      <div className="artist-avatar-placeholder">
                        {song.artist?.artistProfile?.[0] || song.artist?.fullName?.[0] || 'A'}
                      </div>
                    )}
                    <div>
                      <p className="artist-name">{song.artist?.artistProfile || song.artist?.fullName}</p>
                      <p className="artist-email">{song.artist?.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">📝</div>
                <div className="detail-content">
                  <h3 className="detail-title">Lyrics</h3>
                  {song.lyrics && song.lyrics.length > 0 ? (
                    <div className="lyrics-preview">
                      {song.lyrics.slice(0, 10).map((lyric, index) => (
                        <div
                          key={lyric.id || index}
                          className={`lyric-preview-line ${lyric.font ? `font-${lyric.font}` : ''}`}
                        >
                          <span className="lyric-time">
                            {formatTime(lyric.timestamp / 1000)}
                          </span>
                          <span className="lyric-text">{lyric.lyricText}</span>
                        </div>
                      ))}
                      {song.lyrics.length > 10 && (
                        <p className="lyrics-more">+ {song.lyrics.length - 10} more lyrics</p>
                      )}
                    </div>
                  ) : (
                    <p className="detail-empty">No lyrics set for this song</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lyric video section */}
          {song.lyricVideo && (
            <div className="song-details-section">
              <h2 className="section-title">Lyric Video</h2>
              <div className="lyric-video-card">
                <div className="lyric-video-preview">
                  {song.lyricVideo.thumbnailUrl ? (
                    <img src={song.lyricVideo.thumbnailUrl} alt="Lyric video thumbnail" />
                  ) : (
                    <div className="lyric-video-placeholder">
                      <span>🎬</span>
                      <p>Lyric Video</p>
                    </div>
                  )}
                </div>
                <div className="lyric-video-info">
                  <p className="text-muted">This song has a lyric video that will play instead of timeline lyrics.</p>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handlePlay({ ...song, useLyricVideo: true })}
                  >
                    Play with Lyric Video
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
