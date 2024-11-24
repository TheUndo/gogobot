# See the following issue comment as to why we're using this image instead of oven/bun:slim
# (https://github.com/prisma/prisma/discussions/24632#discussioncomment-9878399)
FROM imbios/bun-node:22-debian AS base

# Set working directory of app
WORKDIR /app

# Install required system packages
RUN apt-get update && \
  apt-get install cron git -y

# Static environment variables
ENV DATABASE_URL="file:./dev.db"
ENV NEWS_DOMAIN=https://gogotaku.info
ENV BUN_ENV=development

# Install + cache app dependencies
FROM base AS install
RUN mkdir -p /tmp/app-install/website
COPY package.json bun.lockb schema.prisma /tmp/app-install/
COPY website/package.json /tmp/app-install/website/
RUN cd /tmp/app-install && bun install --frozen-lockfile

# Main app stage
FROM base AS release

# Copy files to workdir
COPY --from=install /tmp/app-install/node_modules node_modules
COPY . .

# Set up cron jobs
RUN crontab -l | { cat; echo "0 * * * * bun /app/gogo/scraper/scrapeEverything.ts"; } | crontab -
RUN crontab -l | { cat; echo "*/5 * * * * bun /app/gogo/scraper/scrapeRecents.ts"; } | crontab -

CMD ["/bin/sh", "-c", "cron && bun bot/start.ts"]
