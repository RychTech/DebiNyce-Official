require('dotenv').config();
const path = require('path');
const bcrypt = require('bcryptjs');
const prisma = require(path.join(__dirname, '..', 'src', 'config', 'db'));

async function main() {
  const demoArtists = [
    { username: 'lina_waves', email: 'lina@demo.debinyce', fullName: 'Lina Waves', artistProfile: 'Lina Waves', nation: 'Uganda', phone: '+256701', photo: null },
    { username: 'k_ripples', email: 'kay@demo.debinyce', fullName: 'K Ripples', artistProfile: 'K Ripples', nation: 'Kenya', phone: '+254702', photo: null },
  ];

  const demoPassword = await bcrypt.hash('demo123456', 12);

  const artistIds = [];
  for (const a of demoArtists) {
    let artist = await prisma.user.findUnique({ where: { email: a.email } });
    if (!artist) {
      artist = await prisma.user.create({
        data: {
          username: a.username,
          email: a.email,
          password: demoPassword,
          fullName: a.fullName,
          artistProfile: a.artistProfile,
          nationality: a.nation,
          phone: a.phone,
          role: 'ARTIST',
          artistStatus: 'APPROVED',
          isVerified: true,
          isFirstLogin: false,
        },
      });
      console.log(`CREATED artist: ${a.artistProfile}`);
    }
    artistIds.push(artist.id);
  }

  const demo = [
    { title: 'Midnight Drift', genre: 'Afro', duration: 190 },
    { title: 'Neon Pulse', genre: 'Electronic', duration: 204 },
    { title: 'Golden Hour', genre: 'R&B', duration: 173 },
    { title: 'Street Symphony', genre: 'Hip-Hop', duration: 158 },
    { title: 'Echoes', genre: 'Amapiano', duration: 224 },
    { title: 'High Tide', genre: 'Dancehall', duration: 191 },
    { title: 'Paper Planes', genre: 'Pop', duration: 169 },
    { title: 'Silent Rivers', genre: 'Soul', duration: 247 },
    { title: 'Full Moon', genre: 'Afrobeats', duration: 215 },
    { title: 'Velvet Rain', genre: 'Soul', duration: 188 },
  ];

  const songs = [];
  for (let i = 0; i < demo.length; i++) {
    const s = demo[i];
    let song = await prisma.song.findFirst({ where: { title: s.title } });
    if (!song) {
      song = await prisma.song.create({
        data: {
          title: s.title,
          artistId: artistIds[i % artistIds.length],
          audioUrl: `https://cdn.debinyce.freedev.app/audio/${s.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.mp3`,
          albumArtUrl: null,
          backgroundUrl: null,
          duration: s.duration,
          genre: s.genre,
          isPublished: true,
        },
      });
      console.log(`CREATED song: ${s.title}`);
    }
    songs.push(song);

    const counts = {
      plays: 60 + Math.floor(Math.random() * 260),
      streams: 40 + Math.floor(Math.random() * 200),
      likes: 15 + Math.floor(Math.random() * 90),
      shares: 5 + Math.floor(Math.random() * 40),
    };
    await prisma.song.update({
      where: { id: song.id },
      data: {
        plays: counts.plays,
        streams: counts.streams,
        likes: counts.likes,
        shares: counts.shares,
      },
    });
  }

  // Activity events over the last 7 days
  const types = ['PLAY', 'STREAM', 'LIKE', 'SHARE', 'SIGNUP'];
  const eventCount = 900;
  const now = Date.now();
  const events = [];
  for (let i = 0; i < eventCount; i++) {
    const backMs = Math.floor(Math.random() * 7 * 24 * 3600 * 1000);
    const type = types[Math.floor(Math.random() * types.length)];
    const song = songs[Math.floor(Math.random() * songs.length)];
    events.push({
      type,
      userId: type === 'SIGNUP' ? null : null,
      songId: type === 'SIGNUP' ? null : song.id,
      createdAt: new Date(now - backMs),
    });
  }
  await prisma.event.createMany({ data: events });
  console.log(`CREATED ${events.length} activity events`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(async () => prisma.$disconnect());