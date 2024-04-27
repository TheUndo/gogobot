import { CronJob } from "cron";
import { aggregateClanStatistics } from "./clans/aggregateClanStatistics";
import { fixClanChannels } from "./clans/fixClanChannels";
import { fixClanRoles } from "./clans/fixClanRoles";
import { syncDiscordUsernameCache } from "./misc/syncDiscordUsernameCache";

await fixClanRoles();
await fixClanChannels();

new CronJob("0 * * * *", aggregateClanStatistics).start();
new CronJob("0 * * * *", fixClanRoles).start();
new CronJob("0 0 * * *", fixClanChannels).start();
new CronJob("0 * * * *", syncDiscordUsernameCache).start();
new CronJob("0 * * * *", syncDiscordUsernameCache).start();
