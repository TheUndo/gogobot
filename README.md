
<div align="center">
  <img align="center" src="https://bot.undo.club/logo-small.png" width="100" />
  <center>
    <a href="https://bot.undo.club"><h1 align="center">GoGoBot</h1></a>
  </center>
</div>

## About

The official [Gogoanime](https://anitaku.so) Discord Robot.

Features:
- Clans
- Economy
- Anime
- And much more!

## Installation

> GoGoBot no longer supports Node, get Bun or don't run

Install [bun](https://bun.sh)

```sh
git clone https://github.com/TheUndo/gogobot.git # downloads repo
cd gogobot                                       # enter directory
cp .env.example .env                             # copy environment variables
bun install                                      # install dependencies
bunx prisma db push                              # install prisma
```

After installing open `.env` and edit it.

## Usage

### Development

```sh
bun .                             # Start bot
bun scraper/scrapeEverything.ts   # Scrape anime (optional)
bun scraper/scrapeRecents.ts      # Scrape recents and notify (optional)
bun scraper/scrapeNews.ts         # Scrape news (optional)
```

### Production

```sh
bunx pm2 start ecosystem.config.cjs
```

## Technical information

- Database: [sqlite (Prisma)](https://www.prisma.io/)
- Runtime: [Bun](https://bun.sh)
- Primary language: [TypeScript](https://www.typescriptlang.org/)
- Discord API SDK: [Discord.js](https://discord.js.org)
- Process manager: [pm2](https://pm2.io/)
- Frontend framework: [Qwik](https://qwik.dev)
- PaaS: [Cloudflare pages](https://pages.dev)
