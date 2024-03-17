module.exports = {
  apps: [
    {
      name: "bot",
      interpreter: "bun",
      script: "index.ts",
    },
    {
      name: "scraper",
      interpreter: "bun",
      script: "scraper/scrapeEverything.ts",
      cron_restart: "0 * * * *",
    },
    {
      name: "latest",
      interpreter: "bun",
      script: "scraper/scrapeRecents.ts",
      cron_restart: "*/15 * * * *",
    },
    {
      name: "digest",
      interpreter: "bun",
      script: "scraper/digest.ts",
      cron_restart: "0 * * * *",
    },
  ],
};
