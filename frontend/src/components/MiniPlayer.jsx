import { usePlayer } from '../context/PlayerContext'

export default function MiniPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    next,
    prev,
    toggleFull,
    toggleQueue,
    closePlayer,
    expandFull,
  } = usePlayer()

  if (!currentSong || expandFull) return null

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="mini-player">
      <div className="mini-player-progress" style={{ width: `${progress}%` }} />

      <div className="mini-player-art" onClick={toggleFull}>
        {currentSong.albumArtUrl ? (
          <img src={currentSong.albumArtUrl} alt={currentSong.title} />
        ) : (
          <span>♪</span>
        )}
      </div>

      <div className="mini-player-info" onClick={toggleFull}>
        <div className="mini-player-title">{currentSong.title}</div>
        <div className="mini-player-artist">
          {currentSong.artist?.artistProfile || currentSong.artist?.fullName || 'Unknown Artist'}
        </div>
      </div>

      <div className="mini-player-controls">
        <button className="mini-control" onClick={toggleQueue} aria-label="Up next" title="Up next">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M3 6h13v1.5H3V6zm0 5h13v1.5H3V11zm0 5h8v1.5H3V16zm13-1.5c.6-1.2 3-3.9 4-3.9V18c0 1.1-.9 2-2 2s-2-.9-2-2  .9-2 2-2" />
          </svg>
        </button>

        <button className="mini-control" onClick={prev} aria-label="Previous">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        <button className="mini-control mini-control--play" onClick={togglePlay} aria-label="Play or pause">
          {isPlaying ? (
            <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button className="mini-control" onClick={next} aria-label="Next">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6z" />
          </svg>
        </button>

        <button className="mini-control mini-control--close" onClick={closePlayer} aria-label="Close player">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>
    </div>
  )
}