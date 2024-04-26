module.exports = {
  apps: [
    {
      name: "bot",
      interpreter: "bun",
      script: "bot/start.ts",
    },
    {
      name: "scraper",
      interpreter: "bun",
      script: "gogo/scraper/scrapeEverything.ts",
      cron_restart: "0 * * * *",
    },
    {
      name: "latest",
      interpreter: "bun",
      script: "gogo/scraper/scrapeRecents.ts",
      cron_restart: "*/15 * * * *",
    },
    {
      name: "news",
      interpreter: "bun",
      script: "gogo/scraper/scrapeNews.ts",
      cron_restart: "*/30 * * * *",
    },
  ],
};
