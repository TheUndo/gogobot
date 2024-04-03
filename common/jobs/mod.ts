import { CronJob } from "cron";
import { aggregateClanStatistics } from "./aggregateClanStatistics";

await aggregateClanStatistics();

new CronJob("0 * * * *", aggregateClanStatistics).start();
