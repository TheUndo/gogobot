import { CronJob } from "cron";
import { aggregateClanStatistics } from "./aggregateClanStatistics";
import { fixClanRoles } from "./fixClanRoles";
import { fixClanChannels } from "./fixClanChannels";

new CronJob("0 * * * *", aggregateClanStatistics).start();
new CronJob("0 * * * *", fixClanRoles).start();
new CronJob("0 0 * * *", fixClanChannels).start();
