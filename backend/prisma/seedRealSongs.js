const path = require('path')
const fs = require('fs')
const { parseFile } = require('music-metadata')
const prisma = require(path.join(__dirname, '..', 'src', 'config', 'db'))

const MUSIC_DIR = 'C:\\Users\\SirRyghan\\Music'
const UPLOADS_AUDIO = path.join(__dirname, '..', 'uploads', 'audio')

const slug = (name) =>
  name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')

const CATALOG = [
  {
    username: 'lina_waves',
    tracks: [
      { file: 'Heat Waves.mp3', title: 'Heat Waves', genre: 'Indie Pop' },
      { file: 'Believer.mp3', title: 'Believer', genre: 'Alt Rock' },
      { file: 'Enemy - From the series Arcane League of Legends_spotdown.org.mp3', title: 'Enemy', genre: 'Alt Electronic' },
      { file: 'lovely (with Khalid).mp3', title: 'lovely (with Khalid)', genre: 'Pop' },
      { file: 'Juice WRLD - Lucid Dreams (Official Music Video).mp3', title: 'Lucid Dreams', genre: 'Emo Rap' },
    ],
  },
  {
    username: 'k_ripples',
    tracks: [
      { file: 'Dior.mp3', title: 'Dior', genre: 'Drill' },
      { file: 'Element.mp3', title: 'Element', genre: 'Hip-Hop' },
      { file: 'Doja.mp3', title: 'Doja', genre: 'UK Drill' },
      { file: 'The Box.mp3', title: 'The Box', genre: 'Trap' },
      { file: 'Ransom.mp3', title: 'Ransom', genre: 'Trap' },
    ],
  },
]

async function readDuration(filePath) {
  try {
    const meta = await parseFile(filePath)
    return Math.round((meta.format.duration || 0) * 100) / 100
  } catch {
    return 0
  }
}

async function main() {
  console.log('Clearing existing songs / playlists / events...')
  await prisma.event.deleteMany()
  await prisma.playlist.deleteMany()
  await prisma.lyricVideo.deleteMany()
  await prisma.song.deleteMany()

  if (!fs.existsSync(UPLOADS_AUDIO)) fs.mkdirSync(UPLOADS_AUDIO, { recursive: true })

  let created = 0
  for (const artistCfg of CATALOG) {
    const artist = await prisma.user.findUnique({ where: { username: artistCfg.username } })
    if (!artist) {
      console.error(`Artist not found: ${artistCfg.username}`)
      continue
    }

    const songRows = []
    for (let i = 0; i < artistCfg.tracks.length; i++) {
      const track = artistCfg.tracks[i]
      const src = path.join(MUSIC_DIR, track.file)
      if (!fs.existsSync(src)) {
        console.warn(`Missing file, skipping: ${track.file}`)
        continue
      }
      const destName = `${slug(track.title)}.mp3`
      const dest = path.join(UPLOADS_AUDIO, destName)
      if (!fs.existsSync(dest)) fs.copyFileSync(src, dest)

      const duration = await readDuration(dest)
      const relUrl = `/uploads/audio/${destName}`
      const plays = 96 + ((i * 173) % 180)
      const streams = Math.round(plays * (0.35 + ((i * 37) % 30) / 100))
      const likes = Math.round(plays * (0.05 + ((i * 13) % 20) / 100))
      const shares = Math.round(plays * (0.03 + ((i * 7) % 12) / 100))

      songRows.push({
        title: track.title,
        genre: track.genre,
        audioUrl: relUrl,
        duration,
        isPublished: true,
        plays,
        streams,
        likes,
        shares,
      })
      console.log(`  queued ${track.title} -> ${relUrl}  (${duration}s)`)
    }

    for (const row of songRows) {
      await prisma.song.create({
        data: { ...row, artistId: artist.id },
      })
      created++
    }

    if (songRows.length >= 2) {
      const artistSongs = await prisma.song.findMany({
        where: { artistId: artist.id, isPublished: true },
        orderBy: { plays: 'desc' },
      })
      const plName = artistCfg.username === 'lina_waves' ? 'Midnight Drive' : 'Late Night Raps'
      await prisma.playlist.create({
        data: {
          name: plName,
          userId: artist.id,
          isPublic: true,
          songs: { create: artistSongs.slice(0, 4).map((s) => ({ songId: s.id })) },
        },
      })
      console.log(`  playlist "${plName}" (${Math.min(4, artistSongs.length)} songs)`)
    }
  }

  console.log(`Done. ${created} real song(s) loaded.`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})