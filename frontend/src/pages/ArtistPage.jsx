import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import GlobalNav from '../components/GlobalNav'
import SongCard from '../components/SongCard'

const API_BASE = '/api'

export default function ArtistPage({ user, onLogout }) {
  const { id } = useParams()
  const [artist, setArtist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetch(`${API_BASE}/artists/${id}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setArtist(d.artist)
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="app-page">
      <GlobalNav user={user} onLogout={onLogout} />

      <main className="browse-main">
        <div className="container">
          {loading ? (
            <div className="song-detail-loading">
              <div className="loading-spinner" />
              <p>Loading artist…</p>
            </div>
          ) : error || !artist ? (
            <div className="empty-state">
              <div className="empty-icon">🎤</div>
              <h3>Artist not found</h3>
              <p>This artist isn't here yet.</p>
            </div>
          ) : (
            <>
              <section className="artist-hero">
                <div className="artist-hero-photo">
                  {artist.photo ? (
                    <img src={artist.photo} alt={artist.artistProfile || artist.fullName} />
                  ) : (
                    <span>♪</span>
                  )}
                </div>
                <div className="artist-hero-info">
                  <span className="artist-verified">✓ Verified Artist</span>
                  <h1 className="artist-hero-name">{artist.artistProfile || artist.fullName}</h1>
                  <p className="artist-hero-meta">
                    {artist.nationality ? `${artist.nationality} · ` : ''}
                    {artist.songs.length} song{artist.songs.length === 1 ? '' : 's'}
                  </p>
                </div>
              </section>

              <section className="browse-section">
                <div className="section-head">
                  <h2 className="section-title">Discography</h2>
                </div>
                {artist.songs.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🎵</div>
                    <h3>No songs yet</h3>
                    <p>This artist hasn't published anything yet.</p>
                  </div>
                ) : (
                  <div className="song-grid">
                    {artist.songs.map((song, idx) => (
                      <SongCard
                        key={song.id}
                        song={{ ...song, artist: { id: artist.id, artistProfile: artist.artistProfile, fullName: artist.fullName } }}
                        queue={artist.songs.map((s) => ({ ...s, artist: { id: artist.id, artistProfile: artist.artistProfile, fullName: artist.fullName } }))}
                        index={idx}
                      />
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