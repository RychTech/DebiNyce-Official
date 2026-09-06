import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayer, isLikedLocal, toggleLikedLocal } from '../context/PlayerContext'

function HeartButton({ song, onToggle }) {
  const [liked, setLiked] = useState(() => isLikedLocal(song.id))

  const handle = async (e) => {
    e.stopPropagation()
    const nowLiked = toggleLikedLocal(song)
    setLiked(nowLiked)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/songs/${song.id}/${nowLiked ? 'like' : 'unlike'}`, {
        method: nowLiked ? 'POST' : 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      onToggle?.(song.id, data.likes)
    } catch {}
  }

  return (
    <button
      className={`heart-btn ${liked ? 'liked' : ''}`}
      onClick={handle}
      aria-label={liked ? 'Unlike' : 'Like'}
      title={liked ? 'Unlike' : 'Like'}
    >
      <svg viewBox="0 0 24 24" width="15" height="15" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M12 21s-6.5-4.35-9.33-8.11C.7 9.9 1.85 6.5 5.1 6.5c1.9 0 3.1 1.1 3.9 2.15.8-1.05 2-2.15 3.9-2.15 3.25 0 4.4 3.4 2.43 6.39C18.5 16.65 12 21 12 21z" />
      </svg>
    </button>
  )
}

export default function SongCard({ song, queue, index = 0 }) {
  const navigate = useNavigate()
  const { playSong, togglePlay, currentSong, isPlaying } = usePlayer()
  const isCurrent = currentSong?.id === song.id
  const active = isCurrent && isPlaying

  const artistName = song.artist?.artistProfile || song.artist?.fullName || 'Unknown Artist'

  const onPlayClick = (e) => {
    e.stopPropagation()
    if (isCurrent) togglePlay()
    else playSong(song, queue || [song])
  }

  return (
    <div className="song-card" style={{ '--i': index }}>
      <div className="song-card-art" onClick={() => navigate(`/songs/${song.id}`)}>
        {song.albumArtUrl ? (
          <img src={song.albumArtUrl} alt={song.title} />
        ) : (
          <div className="song-card-art-ph">♪</div>
        )}
        <button
          className={`song-card-play ${active ? 'playing' : ''}`}
          onClick={onPlayClick}
          aria-label={active ? 'Pause' : 'Play'}
        >
          {active ? (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <HeartButton song={song} />
      </div>

      <div className="song-card-info" onClick={() => navigate(`/songs/${song.id}`)}>
        <div className="song-card-title">{song.title}</div>
        <div className="song-card-artist">{artistName}</div>
      </div>

      <div className="song-card-stats">
        <span className="chip-stats" title="Plays">▶ {song.plays || 0}</span>
        <span className="chip-stats" title="Streams">📶 {song.streams || 0}</span>
        <span className="chip-stats" title="Likes">♥ {song.likes || 0}</span>
        <span className="chip-stats" title="Shares">↗ {song.shares || 0}</span>
      </div>
    </div>
  )
}