# Gogo Robot

The official Gogoanime Discord Robot.

Join the Gogoanime server: https://discord.gg/gogo

## Installation

Install [bun](https://bun.sh) or [node](https://nodejs.org/)

```sh
git clone https://github.com/TheUndo/gogobot.git
cd gogobot
cp .env.example .env
bunx prisma db push
bunx prisma generate
bun install
```

then open .env and edit it.

## Usage

### Development

Bun:
```sh
bun . # Bot commands
bun scraper/scrapeEverything.ts # Scrape anime
bun scraper/scrapeRecents.ts # Scrape recents and notify
```

Node:
```sh
node -r sucrase/register . # Bot commands
node -r sucrase/register scraper/scrapeEverything.ts # Scrape anime
node -r sucrase/register scraper/scrapeRecents.ts # Scrape recents and notify
```

### Production

```sh
bunx pm2 start ecosystem.config.cjs
```

## Technical info

- db: sqlite (Prisma)
- runtime: [bun](https://bun.sh)/[node](https://nodejs.org/)
- language: TypeScript
- sdk: [Discord.js](https://discord.js.org)
