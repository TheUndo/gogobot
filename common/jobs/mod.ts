import { CronJob } from "cron";
import { aggregateClanStatistics } from "./aggregateClanStatistics";
import { fixClanRoles } from "./fixClanRoles";

await fixClanRoles();

new CronJob("0 * * * *", aggregateClanStatistics).start();
new CronJob("0 * * * *", fixClanRoles).start();
