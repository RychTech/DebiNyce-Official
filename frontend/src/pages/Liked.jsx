import GlobalNav from '../components/GlobalNav'
import SongCard from '../components/SongCard'
import { useLikedSongs } from '../context/PlayerContext'

export default function LikedPage({ user, onLogout }) {
  const songs = useLikedSongs()

  return (
    <div className="app-page">
      <GlobalNav user={user} onLogout={onLogout} />

      <main className="browse-main">
        <div className="container">
          <header className="browse-header">
            <div>
              <h1 className="browse-title">
                Liked <span className="gradient-text">Songs</span>
              </h1>
              <p className="browse-subtitle">
                {songs.length} song{songs.length === 1 ? '' : 's'} you've hearted.
              </p>
            </div>
          </header>

          {songs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">♥</div>
              <h3>Nothing liked yet</h3>
              <p>Tap the heart on any song to save it here.</p>
            </div>
          ) : (
            <div className="song-grid" style={{ marginTop: '24px' }}>
              {songs.map((song, idx) => (
                <SongCard key={song.id} song={song} queue={songs} index={idx} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}