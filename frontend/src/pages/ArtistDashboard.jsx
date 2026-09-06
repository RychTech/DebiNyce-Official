import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = '/api'

export default function ArtistDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [songs, setSongs] = useState([])
  const [songsLoading, setSongsLoading] = useState(false)
  const [uploadModal, setUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [tab, setTab] = useState('songs')

  // Upload form state
  const [songTitle, setSongTitle] = useState('')
  const [songGenre, setSongGenre] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [artFile, setArtFile] = useState(null)
  const [bgFile, setBgFile] = useState(null)

  // Friend/Collab requests
  const [friendRequests, setFriendRequests] = useState([])
  const [collabRequests, setCollabRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(false)

  // Playlists
  const [playlists, setPlaylists] = useState([])
  const [createPlaylistModal, setCreatePlaylistModal] = useState(false)
  const [playlistName, setPlaylistName] = useState('')
  const [playlistPublic, setPlaylistPublic] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          if (data.user.role !== 'ARTIST' || data.user.artistStatus !== 'APPROVED') {
            navigate('/')
            return
          }
          setUser(data.user)
        } else {
          navigate('/login')
        }
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false))
  }, [navigate])

  const fetchSongs = async () => {
    const token = localStorage.getItem('token')
    setSongsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/songs`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        // Filter to only show user's songs
        const mySongs = data.songs.filter((s) => s.artist?.id === user?.id)
        setSongs(mySongs)
      }
    } catch {
      console.error('Failed to fetch songs')
    } finally {
      setSongsLoading(false)
    }
  }

  const fetchRequests = async () => {
    const token = localStorage.getItem('token')
    setRequestsLoading(true)
    try {
      const [frRes, crRes, plRes] = await Promise.all([
        fetch(`${API_BASE}/friends/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/collab/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/playlists/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const [frData, crData, plData] = await Promise.all([
        frRes.json(),
        crRes.json(),
        plRes.json(),
      ])

      if (frData.success) setFriendRequests(frData.requests)
      if (crData.success) setCollabRequests(crData.requests)
      if (plData.success) setPlaylists(plData.playlists)
    } catch {
      console.error('Failed to fetch requests')
    } finally {
      setRequestsLoading(false)
    }
  }

  const handleAcceptFriend = async (requestId) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_BASE}/friends/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      })
      if (res.ok) {
        fetchRequests()
        fetchSongs()
      }
    } catch {
      alert('Failed to accept friend request')
    }
  }

  const handleRejectFriend = async (requestId) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_BASE}/friends/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      })
      if (res.ok) fetchRequests()
    } catch {
      alert('Failed to reject friend request')
    }
  }

  const handleAcceptCollab = async (requestId) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_BASE}/collab/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      })
      const data = await res.json()
      if (data.success) {
        alert(
          `Collaboration accepted! Contact info shared:\n\n` +
          `Artist: ${data.sharedInfo?.fullName || data.sharedInfo?.artistProfile}\n` +
          `Email: ${data.sharedInfo?.email}\n` +
          `Phone: ${data.sharedInfo?.phone}\n\n` +
          `You can now reach them directly. Your info has also been shared with them.`
        )
        fetchRequests()
      }
    } catch {
      alert('Failed to accept collaboration request')
    }
  }

  const handleRejectCollab = async (requestId) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_BASE}/collab/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      })
      if (res.ok) fetchRequests()
    } catch {
      alert('Failed to reject collaboration request')
    }
  }

  const handleCreatePlaylist = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_BASE}/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: playlistName, isPublic: playlistPublic }),
      })
      if (res.ok) {
        setCreatePlaylistModal(false)
        setPlaylistName('')
        fetchRequests()
      }
    } catch {
      alert('Failed to create playlist')
    }
  }

  const handleDeletePlaylist = async (playlistId) => {
    if (!confirm('Delete this playlist?')) return
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_BASE}/playlists/${playlistId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) fetchRequests()
    } catch {
      alert('Failed to delete playlist')
    }
  }

  useEffect(() => {
    if (user) {
      fetchSongs()
      fetchRequests()
    }
  }, [user])

  const readAudioDuration = (file) =>
    new Promise((resolve) => {
      if (!file) return resolve(0)
      const url = URL.createObjectURL(file)
      const audio = document.createElement('audio')
      audio.preload = 'metadata'
      audio.onloadedmetadata = () => {
        resolve(Math.round(audio.duration) || 0)
        URL.revokeObjectURL(url)
      }
      audio.onerror = () => {
        resolve(0)
        URL.revokeObjectURL(url)
      }
      audio.src = url
    })

  const handleUpload = async (e) => {
    e.preventDefault()
    setUploadError('')

    if (!songTitle || !audioFile) {
      setUploadError('Song title and audio file are required.')
      return
    }

    if (!audioFile.type.startsWith('audio/')) {
      setUploadError('Please choose a valid audio file (MP3, WAV, M4A…).')
      return
    }

    const token = localStorage.getItem('token')
    setUploading(true)

    try {
      const duration = await readAudioDuration(audioFile)
      const formData = new FormData()
      formData.append('title', songTitle)
      formData.append('genre', songGenre || '')
      formData.append('duration', String(duration))
      formData.append('audio', audioFile)
      if (artFile) formData.append('albumArt', artFile)
      if (bgFile) formData.append('background', bgFile)

      const res = await fetch(`${API_BASE}/songs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setUploadError(data.message || 'Failed to create song.')
        setUploading(false)
        return
      }

      setUploadModal(false)
      setSongTitle('')
      setAudioFile(null)
      setArtFile(null)
      setBgFile(null)
      setSongGenre('')
      setUploadError('')

      // Refresh songs list
      fetchSongs()
    } catch {
      setUploadError('Network error. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (songId) => {
    if (!confirm('Are you sure you want to delete this song?')) return

    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_BASE}/songs/${songId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        fetchSongs()
      }
    } catch {
      alert('Failed to delete song.')
    }
  }

  const handleTogglePublish = async (songId) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_BASE}/songs/${songId}/publish`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        fetchSongs()
      }
    } catch {
      alert('Failed to update song.')
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Loading...
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="artist-dashboard">
      {/* Navbar */}
      <nav className="artist-nav">
        <div className="artist-nav-inner">
          <div className="artist-nav-brand">
            <span className="artist-nav-logo">DebiNyce</span>
            <span className="artist-nav-tagline">Sync To The Groove.</span>
          </div>

          <div className="artist-nav-menu">
            <span className="artist-nav-user">
              {user.artistProfile || user.fullName || 'Artist'}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/')}
            >
              Exit Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="artist-main">
        <div className="container">
          <header className="artist-header">
            <div>
              <h1 className="artist-header-title">Artist Dashboard</h1>
              <p className="artist-header-subtitle">
                Manage your music, uploads, and profile
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setUploadModal(true)}
            >
              + Upload New Song
            </button>
          </header>

          {/* Tabs */}
          <div className="songs-table-wrapper" style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--border)',
              gap: '0',
            }}>
              {['songs', 'friends', 'collab', 'playlists'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '14px 20px',
                    background: 'none',
                    border: 'none',
                    borderBottom: tab === t ? '2px solid var(--peach-300)' : '2px solid transparent',
                    color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: 500,
                    fontSize: '0.9375rem',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {t === 'songs' ? '🎵' : t === 'friends' ? '👥' : t === 'collab' ? '🤝' : '📋'}
                  {t}
                  {t === 'friends' && friendRequests.length > 0 && (
                    <span style={{
                      background: 'var(--peach-300)',
                      color: 'var(--black-900)',
                      borderRadius: '50%',
                      padding: '2px 6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}>
                      {friendRequests.length}
                    </span>
                  )}
                  {t === 'collab' && collabRequests.length > 0 && (
                    <span style={{
                      background: 'var(--peach-300)',
                      color: 'var(--black-900)',
                      borderRadius: '50%',
                      padding: '2px 6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}>
                      {collabRequests.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Stats cards */}
          <div className="artist-stats">
            <div className="stat-card">
              <div className="stat-value">{songs.length}</div>
              <div className="stat-label">Total Songs</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {songs.filter((s) => s.isPublished).length}
              </div>
              <div className="stat-label">Published</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {songs.filter((s) => !s.isPublished).length}
              </div>
              <div className="stat-label">Pending Review</div>
            </div>
          </div>

          {/* Songs table */}
          <section className="artist-section">
            <h2 className="artist-section-title">Your Songs</h2>

            {songsLoading ? (
              <div className="loading-state">Loading songs...</div>
            ) : songs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎵</div>
                <h3>No songs yet</h3>
                <p>Upload your first track to get started</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setUploadModal(true)}
                >
                  Upload Your First Song
                </button>
              </div>
            ) : (
              <div className="songs-table-wrapper">
                <table className="songs-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Genre</th>
                      <th>Status</th>
                      <th>Album Art</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {songs.map((song) => (
                      <tr key={song.id}>
                        <td className="song-title-cell">
                          <div className="song-title-wrapper">
                            <div className="song-art-placeholder">
                              {song.albumArtUrl ? (
                                <img
                                  src={song.albumArtUrl}
                                  alt={song.title}
                                  className="song-art-img"
                                />
                              ) : (
                                <span className="song-art-icon">♪</span>
                              )}
                            </div>
                            <div className="song-title-info">
                              <span className="song-title">{song.title}</span>
                              <span className="song-artist">
                                by {song.artist?.artistProfile || song.artist?.fullName}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>{song.genre || '—'}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              song.isPublished ? 'status-published' : 'status-pending'
                            }`}
                          >
                            {song.isPublished ? 'Published' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          {song.albumArtUrl ? (
                            <img
                              src={song.albumArtUrl}
                              alt="Album art"
                              className="song-thumb"
                            />
                          ) : (
                            <span className="text-muted">No art</span>
                          )}
                        </td>
                        <td>
                          <div className="song-actions">
                            {song.isPublished ? (
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleTogglePublish(song.id)}
                                title="Unpublish song"
                              >
                                Unpublish
                              </button>
                            ) : (
                              <>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleTogglePublish(song.id)}
                                  title="Publish song"
                                >
                                  Publish
                                </button>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => handleDelete(song.id)}
                                  title="Delete song"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Profile info */}
          <section className="artist-section">
            <h2 className="artist-section-title">Your Profile</h2>
            <div className="profile-card">
              <div className="profile-avatar">
                {user.photo ? (
                  <img src={user.photo} alt="Profile" />
                ) : (
                  <span className="profile-avatar-placeholder">
                    {user.artistProfile?.[0] || user.fullName?.[0] || 'A'}
                  </span>
                )}
              </div>
              <div className="profile-info">
                <h3 className="profile-name">{user.artistProfile || user.fullName}</h3>
                <p className="profile-email">{user.email}</p>
                <div className="profile-meta">
                  <span>
                    <strong>Nationality:</strong> {user.nationality || 'Not set'}
                  </span>
                  <span>
                    <strong>Phone:</strong> {user.phone || 'Not set'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Upload Modal */}
      {uploadModal && (
        <div className="modal-overlay" onClick={() => setUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload New Song</h2>
              <button
                className="modal-close"
                onClick={() => setUploadModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpload} className="modal-body">
              {uploadError && (
                <div
                  className="modal-error"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    color: '#ef4444',
                    fontSize: '0.875rem',
                    marginBottom: '16px',
                  }}
                >
                  {uploadError}
                </div>
              )}

              <div className="form-group">
                <label className="label">Song Title *</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Midnight Drift"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Genre</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Pop, Rock, Hip-Hop..."
                  value={songGenre}
                  onChange={(e) => setSongGenre(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="label">Audio File *</label>
                <input
                  className="input"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files[0] || null)}
                  required
                />
                <span className="form-hint">
                  {audioFile
                    ? `Ready: ${audioFile.name} (${(audioFile.size / 1048576).toFixed(1)} MB)`
                    : 'Choose your audio file (MP3, WAV, M4A…). Max 25MB.'}
                </span>
              </div>

              <div className="form-group">
                <label className="label">Album Art</label>
                <input
                  className="input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setArtFile(e.target.files[0] || null)}
                />
                <span className="form-hint">
                  {artFile ? `Ready: ${artFile.name}` : 'Square cover image (JPG, PNG, WebP).'}
                </span>
                {artFile && (
                  <div className="upload-preview">
                    <img src={URL.createObjectURL(artFile)} alt="Album art preview" />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="label">Background Art</label>
                <input
                  className="input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBgFile(e.target.files[0] || null)}
                />
                <span className="form-hint">
                  {bgFile ? `Ready: ${bgFile.name}` : 'Wide banner used on song pages (optional).'}
                </span>
              </div>

              <div
                className="modal-footer"
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '24px',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setUploadModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading…' : 'Upload Song'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
