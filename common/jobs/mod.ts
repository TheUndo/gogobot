import { CronJob } from "cron";
import { aggregateClanStatistics } from "./aggregateClanStatistics";
import { fixClanChannels } from "./fixClanChannels";
import { fixClanRoles } from "./fixClanRoles";

new CronJob("0 * * * *", aggregateClanStatistics).start();
new CronJob("0 * * * *", fixClanRoles).start();
new CronJob("0 0 * * *", fixClanChannels).start();
