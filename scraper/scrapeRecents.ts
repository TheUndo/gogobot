import { announceEpisode } from "./announceEpisode";
import { scrapePage } from "./utils";

for (const type of [1, 2, 3]) {
	await scrapePage({
		type,
		page: 1,
		onNewEpisode: announceEpisode,
	});
}

console.log("Done. Idle.");

setInterval(() => {}, 1 << 30);
