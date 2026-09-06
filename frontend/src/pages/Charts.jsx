import { useEffect, useState } from 'react'
import GlobalNav from '../components/GlobalNav'
import SongCard from '../components/SongCard'
import { usePlayer } from '../context/PlayerContext'

const API_BASE = '/api'

const METRICS = [
  { key: 'plays', label: 'Most Played', icon: '▶' },
  { key: 'streams', label: 'Most Streamed', icon: '📶' },
  { key: 'likes', label: 'Most Liked', icon: '♥' },
  { key: 'shares', label: 'Most Shared', icon: '↗' },
]

export default function Charts({ user, onLogout }) {
  const { playSong } = usePlayer()
  const [active, setActive] = useState('plays')
  const [songs, setSongs] = useState([])
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/songs/trending?metric=${active}&limit=12`)
      .then((res) => res.json())
      .then((d) => {
        if (d.success) {
          setSongs(d.songs)
          setData((prev) => ({ ...prev, [active]: d.songs }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [active])

  const metricIcon = METRICS.find((m) => m.key === active).icon

  return (
    <div className="app-page">
      <GlobalNav user={user} onLogout={onLogout} />

      <main className="browse-main">
        <div className="container">
          <header className="browse-header charts-header">
            <div>
              <h1 className="browse-title">
                <span className="gradient-text">Charts</span>
              </h1>
              <p className="browse-subtitle">The library's hottest tunes, ranked by real activity.</p>
            </div>
          </header>

          <div className="charts-tabs">
            {METRICS.map((m) => (
              <button
                key={m.key}
                className={`charts-tab ${active === m.key ? 'active' : ''}`}
                onClick={() => setActive(m.key)}
              >
                <span className="charts-tab-icon">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="song-detail-loading">
              <div className="loading-spinner" />
              <p>Loading charts…</p>
            </div>
          ) : songs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎵</div>
              <h3>No data yet</h3>
              <p>Activity is still warming up for this chart.</p>
            </div>
          ) : (
            <>
              <div className="chart-legends">
                {data.plays?.length > 0 && (
                  <span className="legend-pill">▶ Plays</span>
                )}
                {data.streams?.length > 0 && (
                  <span className="legend-pill">📶 Streams</span>
                )}
                {data.likes?.length > 0 && (
                  <span className="legend-pill">♥ Likes</span>
                )}
                {data.shares?.length > 0 && (
                  <span className="legend-pill">↗ Shares</span>
                )}
              </div>

              <div className="charts-podium">
                {songs.slice(0, 3).map((song, i) => (
                  <div className={`podium-item podium-${i + 1}`} key={song.id}>
                    <div className="podium-rank">{i + 1}</div>
                    <button
                      className="podium-art"
                      onClick={() => playSong(song, songs)}
                      aria-label={`Play ${song.title}`}
                    >
                      {song.albumArtUrl ? (
                        <img src={song.albumArtUrl} alt={song.title} />
                      ) : (
                        <span>♪</span>
                      )}
                    </button>
                    <div className="podium-name">{song.title}</div>
                    <div className="podium-artist">
                      {song.artist?.artistProfile || song.artist?.fullName || 'Unknown Artist'}
                    </div>
                    <div className="podium-value">
                      {song[active]} {metricIcon}
                    </div>
                  </div>
                ))}
              </div>

              <div className="song-grid" style={{ marginTop: '28px' }}>
                {songs.slice(3).map((song, idx) => (
                  <SongCard key={song.id} song={song} queue={songs} index={idx} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}