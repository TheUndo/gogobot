# GoGoBot

Invite bot: https://bot.undo.club

Join the Gogoanime server: https://discord.gg/gogo

- Clans
- Economy
- Anime
- And more!

The official [Gogoanime](https://anitaku.so) Discord Robot.

## Installation

> GoGoBot no longer supports Node, get Bun or don't run

Install [bun](https://bun.sh)

```sh
git clone https://github.com/TheUndo/gogobot.git
cd gogobot
cp .env.example .env
bunx prisma db push
bun install
```

then open .env and edit it.

## Usage

### Development

Bun:

```sh
bun .                             # Bot commands
bun scraper/scrapeEverything.ts   # Scrape anime
bun scraper/scrapeRecents.ts      # Scrape recents and notify
bun scraper/scrapeNews.ts         # Scrape news
```

### Production

```sh
bunx pm2 start ecosystem.config.cjs
```

## Technical info

- db: [sqlite (Prisma)](https://www.prisma.io/)
- runtime: [bun](https://bun.sh)
- language: [TypeScript](https://www.typescriptlang.org/)
- sdk: [Discord.js](https://discord.js.org)
- pm: [pm2](https://pm2.io/)
- frontend: [Qwik](https://qwik.dev)
- PaaS: [Cloudflare pages](https://pages.dev)
