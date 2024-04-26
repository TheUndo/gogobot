import { CronJob } from "cron";
import { aggregateClanStatistics } from "./aggregateClanStatistics";
import { fixClanChannels } from "./fixClanChannels";
import { fixClanRoles } from "./fixClanRoles";
import { syncDiscordUsernameCache } from "./syncDiscordUsernameCache";

await fixClanRoles();
await fixClanChannels();

new CronJob("0 * * * *", aggregateClanStatistics).start();
new CronJob("0 * * * *", fixClanRoles).start();
new CronJob("0 0 * * *", fixClanChannels).start();
new CronJob("0 * * * *", syncDiscordUsernameCache).start();
