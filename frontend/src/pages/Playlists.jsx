import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import GlobalNav from '../components/GlobalNav'

const API_BASE = '/api'

export default function PlaylistsPage({ user, onLogout }) {
  const navigate = useNavigate()
  const { playSong } = usePlayer()
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const fetchPlaylists = async () => {
    try {
      const res = await fetch(`${API_BASE}/playlists/public`)
      const data = await res.json()
      if (data.success) setPlaylists(data.playlists)
    } catch {
      console.error('Failed to fetch playlists')
    } finally {
      setLoading(false)
    }
  }

  const playQueue = (playlist) => {
    if (!playlist.songs || playlist.songs.length === 0) return
    const queue = playlist.songs.map((i) => ({ ...i.song, artist: i.song.artist }))
    playSong(queue[0], queue)
  }

  return (
    <div className="app-page">
      <GlobalNav user={user} onLogout={onLogout} />

      <main className="browse-main">
        <div className="container">
          <header className="browse-header">
            <div>
              <h1 className="browse-title">
                Public <span className="gradient-text">Playlists</span>
              </h1>
              <p className="browse-subtitle">Discover music curated by the community</p>
            </div>
          </header>

          {loading ? (
            <div className="song-detail-loading">
              <div className="loading-spinner" />
              <p>Loading playlists…</p>
            </div>
          ) : playlists.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎵</div>
              <h3>No Playlists Yet</h3>
              <p>Be the first to create a public playlist!</p>
            </div>
          ) : (
            <div className="playlists-grid">
              {playlists.map((playlist) => (
                <div key={playlist.id} className="playlist-card">
                  <div className="playlist-cover">
                    {playlist.songs.length > 0 ? (
                      <div className="playlist-cover-collage">
                        {playlist.songs.slice(0, 4).map((item) => (
                          <div
                            key={item.song.id}
                            className="playlist-cover-item"
                            style={{
                              background: item.song.albumArtUrl
                                ? `url(${item.song.albumArtUrl}) center/cover`
                                : 'var(--gradient-card)',
                            }}
                          >
                            {!item.song.albumArtUrl && <span className="playlist-cover-icon">♪</span>}
                          </div>
                        ))}
                        {playlist.songs.length > 4 && (
                          <div className="playlist-cover-more">
                            +{playlist.songs.length - 4}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="playlist-cover-empty">
                        <span className="playlist-cover-icon-large">🎶</span>
                      </div>
                    )}
                    <div className="playlist-play-overlay">
                      <button
                        className="btn btn-primary"
                        onClick={() => playQueue(playlist)}
                        disabled={playlist.songs.length === 0}
                        style={{ padding: '12px 24px' }}
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ marginRight: '8px' }}>
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Play
                      </button>
                    </div>
                  </div>

                  <div className="playlist-info">
                    <h3 className="playlist-name">{playlist.name}</h3>
                    <p className="playlist-creator">
                      by {playlist.creator?.artistProfile || playlist.creator?.fullName || 'Unknown'}
                    </p>
                    <div className="playlist-meta">
                      <span>{playlist.songCount} songs</span>
                      <span>🔒 Public</span>
                    </div>
                    <div className="playlist-actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => navigate(`/playlists/invite/${playlist.invitationCode}`)}
                      >
                        View Playlist
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}