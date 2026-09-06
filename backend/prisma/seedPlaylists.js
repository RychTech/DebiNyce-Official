const path = require('path')
const prisma = require(path.join(__dirname, '..', 'src', 'config', 'db'))

async function main() {
  const demos = await prisma.user.findMany({
    where: { artistStatus: 'APPROVED', role: 'ARTIST' },
    include: { songs: { where: { isPublished: true }, orderBy: { plays: 'desc' } } },
  })

  const named = [
    { name: 'Midnight Drive', artistMatch: 'Lina Waves' },
    { name: 'Late Night Raps', artistMatch: 'K Ripples' },
  ]

  let created = 0
  for (const cfg of named) {
    const artist = demos.find((d) => d.artistProfile === cfg.artistMatch)
    if (!artist || artist.songs.length < 2) continue
    const existing = await prisma.playlist.findFirst({
      where: { name: cfg.name, userId: artist.id },
    })
    if (existing) continue

    await prisma.playlist.create({
      data: {
        name: cfg.name,
        userId: artist.id,
        isPublic: true,
        songs: {
          create: artist.songs.slice(0, 4).map((s) => ({ songId: s.id })),
        },
      },
    })
    created++
    console.log(`Created playlist "${cfg.name}" (${Math.min(4, artist.songs.length)} songs) by ${cfg.artistMatch}`)
  }

  console.log(`Done. ${created} playlist(s) created.`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})