import { client } from "../common/client";
import { announceEpisode } from "./announceEpisode";
import { DebugLevel, debug, makeCodeBlock } from "./debug";
import { getLanguage, scrapePage } from "./utils";

for (const type of [1, 2, 3]) {
	await debug(
		DebugLevel.Info,
		makeCodeBlock(`Scraping type ${getLanguage(type)} page 1`),
	);
	await scrapePage({
		type,
		page: 1,
		onNewEpisode: announceEpisode,
	});
}

console.log("Done. Idle.");

setInterval(() => {}, 1 << 30);
