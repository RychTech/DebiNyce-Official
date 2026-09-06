import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react'

const PlayerContext = createContext(null)

export function usePlayer() {
  return useContext(PlayerContext)
}

const API_BASE = '/api'

const RECENT_KEY = 'debinyce_recent'

export function getRecentPlayed() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch {
    return []
  }
}

export function formatTime(time) {
  if (!time || isNaN(time)) return '0:00'
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function PlayerProvider({ children }) {
  const audioRef = useRef(null)
  const currentSongRef = useRef(null)
  const pipedStreamRef = useRef(false)
  const playReported = useRef(false)
  const stateRef = useRef({ queue: [], queueIndex: -1, shuffle: false, repeat: 'off' })

  const [currentSong, setCurrentSong] = useState(null)
  const [queue, setQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(-1)
  const [shuffle, setShuffleState] = useState(false)
  const [repeat, setRepeatState] = useState('off')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [expandFull, setExpandFull] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [sleepRemaining, setSleepRemaining] = useState(null)
  const [sleepEndTrack, setSleepEndTrackState] = useState(false)
  const sleepEndTrackRef = useRef(false)

  useEffect(() => {
    sleepEndTrackRef.current = sleepEndTrack
  }, [sleepEndTrack])

  useEffect(() => {
    currentSongRef.current = currentSong
    if (currentSong) pipedStreamRef.current = false
  }, [currentSong])

  useEffect(() => {
    stateRef.current.queue = queue
  }, [queue])

  useEffect(() => {
    stateRef.current.queueIndex = queueIndex
  }, [queueIndex])

  useEffect(() => {
    stateRef.current.shuffle = shuffle
  }, [shuffle])

  useEffect(() => {
    stateRef.current.repeat = repeat
  }, [repeat])

  const pipeEvent = (song, path, ref) => {
    if (!song || ref.current) return
    ref.current = true
    const token = localStorage.getItem('token')
    fetch(`${API_BASE}/songs/${song.id}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => {})
  }

  const pushRecent = (song) => {
    try {
      const list = getRecentPlayed().filter((s) => s.id !== song.id)
      list.unshift({
        id: song.id,
        title: song.title,
        audioUrl: song.audioUrl,
        albumArtUrl: song.albumArtUrl,
        duration: song.duration,
        genre: song.genre,
        artist: song.artist,
      })
      localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 24)))
    } catch {}
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handlePlaying = () => {
      setIsPlaying(true)
      pipeEvent(currentSongRef.current, '/stream', pipedStreamRef)
      playReported.current = true
    }
    const handleEnded = () => {
      if (sleepEndTrackRef.current) {
        sleepEndTrackRef.current = false
        setSleepEndTrackState(false)
        audio.pause()
        setIsPlaying(false)
        setCurrentTime(0)
        return
      }
      const { repeat: rep, queue: q, queueIndex: idx, shuffle: sfl } = stateRef.current
      if (rep === 'one') {
        audio.currentTime = 0
        audio.play().catch(() => {})
        return
      }
      playReported.current = false
      pipedStreamRef.current = false

      if (idx >= 0 && q.length > 1) {
        const plist = q
        if (rep === 'all' || sfl) {
          const nextIdx = sfl
            ? Math.floor(Math.random() * plist.length)
            : (idx + 1) % plist.length
          const nextSong = plist[nextIdx]
          setCurrentSong(nextSong)
          setQueueIndex(nextIdx)
          setExpandFull(true)
          audio.src = nextSong.audioUrl
          audio.play().catch(() => {})
          pushRecent(nextSong)
          return
        }
        if (idx + 1 < q.length) {
          const nextSong = q[idx + 1]
          setCurrentSong(nextSong)
          setQueueIndex(idx + 1)
          setExpandFull(true)
          audio.src = nextSong.audioUrl
          audio.play().catch(() => {})
          pushRecent(nextSong)
          return
        }
      }
      setIsPlaying(false)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('ended', handleEnded)
      audio.pause()
    }
  }, [])

  const playSong = useCallback((song, newQueue) => {
    const audio = audioRef.current
    if (!audio || !song) return

    const q = newQueue && newQueue.length ? newQueue : [song]
    const idx = q.findIndex((s) => s.id === song.id)

    setCurrentSong(song)
    setQueue(q)
    setQueueIndex(idx >= 0 ? idx : 0)
    pushRecent(song)

    if (currentSongRef.current && currentSongRef.current.id === song.id) {
      audio.play().catch(() => {})
      return
    }

    playReported.current = false
    pipedStreamRef.current = false
    const token = localStorage.getItem('token')
    fetch(`${API_BASE}/songs/${song.id}/play`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => {})

    audio.src = song.audioUrl
    audio.play().catch(() => {})
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio || !currentSong) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().catch(() => {})
    }
  }

  const seek = (time) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
    setCurrentTime(time)
  }

  const seekBy = (delta) => {
    const audio = audioRef.current
    if (!audio || isNaN(duration)) return
    const t = Math.min(Math.max(0, audio.currentTime + delta), duration)
    audio.currentTime = t
    setCurrentTime(t)
  }

  const playIndex = (index) => {
    const st = stateRef.current
    if (index < 0 || index >= st.queue.length) return
    playSong(st.queue[index])
  }

  const next = () => {
    const st = stateRef.current
    if (!st.queue.length) return
    if (st.shuffle && st.queue.length > 1) {
      let n = st.queueIndex
      while (n === st.queueIndex) n = Math.floor(Math.random() * st.queue.length)
      playIndex(n)
      return
    }
    const n = st.queueIndex + 1 >= st.queue.length ? 0 : st.queueIndex + 1
    playIndex(n)
  }

  const prev = () => {
    const st = stateRef.current
    if (!st.queue.length) return
    if (currentTime > 3) {
      seek(0)
      return
    }
    const n = st.queueIndex - 1 < 0 ? st.queue.length - 1 : st.queueIndex - 1
    playIndex(n)
  }

  const cycleRepeat = () => {
    setRepeatState((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'))
  }

  const toggleShuffle = () => setShuffleState((s) => !s)

  const setVolumeValue = (val) => {
    const v = parseFloat(val)
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
    setIsMuted(v === 0)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.7
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  const closePlayer = () => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
    }
    setCurrentSong(null)
    setQueue([])
    setQueueIndex(-1)
    setIsPlaying(false)
    setExpandFull(false)
    setShowQueue(false)
    setSleepRemaining(null)
    setSleepEndTrackState(false)
    sleepEndTrackRef.current = false
  }

  // Sleep timer
  useEffect(() => {
    if (sleepRemaining === null) return
    const started = Date.now()
    const interval = setInterval(() => {
      const left = sleepRemaining - (Date.now() - started) / 1000
      if (left <= 0) {
        clearInterval(interval)
        const audio = audioRef.current
        if (audio) audio.pause()
        setIsPlaying(false)
        setSleepRemaining(null)
      } else {
        setSleepRemaining(left)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [sleepRemaining !== null])

  const setSleep = (seconds) => {
    setSleepRemaining(seconds)
    if (sleepEndTrackRef.current) {
      sleepEndTrackRef.current = false
      setSleepEndTrackState(false)
    }
  }

  const setSleepEndTrack = (v) => {
    setSleepEndTrackState(v)
    if (v) setSleepRemaining(null)
  }

  const clearSleep = () => {
    setSleepRemaining(null)
    setSleepEndTrackState(false)
    sleepEndTrackRef.current = false
  }

  const like = async () => {
    if (!currentSong) return
    const token = localStorage.getItem('token')
    const wasLiked = isLikedLocal(currentSong.id)
    toggleLikedLocal(currentSong)
    try {
      const res = await fetch(`${API_BASE}/songs/${currentSong.id}/${wasLiked ? 'unlike' : 'like'}`, {
        method: wasLiked ? 'DELETE' : 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      setCurrentSong((s) => (s ? { ...s, likes: Math.max(0, data.likes ?? s.likes) } : s))
    } catch {
      toggleLikedLocal(currentSong, false)
    }
  }

  const share = async () => {
    if (!currentSong) return
    const token = localStorage.getItem('token')
    fetch(`${API_BASE}/songs/${currentSong.id}/share`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => {})
    const link = `${window.location.origin}/songs/${currentSong.id}`
    setCurrentSong((s) => (s ? { ...s, shares: (s.shares || 0) + 1 } : s))
    try {
      if (navigator.share) {
        await navigator.share({ title: currentSong.title, url: link })
      } else {
        await navigator.clipboard.writeText(link)
      }
    } catch {}
  }

  const upNext = queueIndex >= 0 ? queue.slice(queueIndex + 1) : queue

  const value = {
    currentSong,
    queue,
    queueIndex,
    upNext,
    shuffle,
    repeat,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    expandFull,
    showQueue,
    sleepRemaining,
    sleepEndTrack,
    playSong,
    playIndex,
    togglePlay,
    seek,
    seekBy,
    next,
    prev,
    cycleRepeat,
    toggleShuffle,
    setVolumeValue,
    toggleMute,
    closePlayer,
    toggleFull: () => {
      setExpandFull((v) => !v)
      setShowQueue(false)
    },
    toggleQueue: () => setShowQueue((v) => !v),
    setSleep,
    clearSleep,
    setSleepEndTrack,
    like,
    share,
    formatTime,
  }

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} id="global-audio-source" preload="metadata" />
    </PlayerContext.Provider>
  )
}

// ─── Liked songs (local store) ────────────────────────────────
const LIKED_KEY = 'debinyce_liked'
const likedListeners = new Set()

function emitLiked() {
  likedListeners.forEach((fn) => fn())
}

function readLiked() {
  try {
    return JSON.parse(localStorage.getItem(LIKED_KEY) || '[]')
  } catch {
    return []
  }
}

export function getLikedSongs() {
  return readLiked()
}

export function isLikedLocal(songId) {
  return readLiked().some((s) => s.id === songId)
}

export function toggleLikedLocal(song, shouldSave = true) {
  const list = readLiked()
  const exists = list.some((s) => s.id === song.id)
  const next = exists ? list.filter((s) => s.id !== song.id) : [song, ...list]
  if (shouldSave) localStorage.setItem(LIKED_KEY, JSON.stringify(next))
  emitLiked()
  return !exists
}

export function addToLiked(song) {
  const next = [song, ...readLiked().filter((s) => s.id !== song.id)]
  localStorage.setItem(LIKED_KEY, JSON.stringify(next.slice(0, 200)))
  emitLiked()
  return next
}

export function subscribeLiked(fn) {
  likedListeners.add(fn)
  return () => likedListeners.delete(fn)
}

export function useLikedSongs() {
  const [songs, setSongs] = useState(() => readLiked())
  useEffect(() => subscribeLiked(() => setSongs(readLiked())), [])
  return songs
}